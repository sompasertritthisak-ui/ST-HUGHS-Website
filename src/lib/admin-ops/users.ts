import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { RoleSchema } from "@/lib/enums";
import { can } from "@/lib/rbac";
import type { AdminUser } from "./guard";

export const BCRYPT_COST = 12;
export const MIN_PASSWORD = 12;

export const CreateUserSchema = z.object({
  name: z.string().trim().min(2, "Enter the person's name.").max(120),
  email: z.email("Enter a valid email address.").max(200).transform((v) => v.toLowerCase()),
  role: RoleSchema,
  /** Optional: when blank a temporary password is generated and shown once. */
  password: z.union([z.literal(""), z.string().min(MIN_PASSWORD, `At least ${MIN_PASSWORD} characters.`).max(200)]).optional().default(""),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(2, "Enter the person's name.").max(120),
  role: RoleSchema,
  isActive: z.boolean(),
});

/** URL-safe temporary password: 18 chars from a 62-symbol alphabet (~107 bits). */
export function generateTemporaryPassword(length = 18): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; i < bytes.length && out.length < length; i++) {
    const b = bytes[i];
    if (b < alphabet.length * Math.floor(256 / alphabet.length)) out += alphabet[b % alphabet.length];
  }
  return out.length >= length ? out : out + generateTemporaryPassword(length - out.length);
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export type EscalationCheck = { ok: true } | { ok: false; message: string };

/**
 * Privilege-escalation rules, shared by server actions and the API:
 *  - only SUPER_ADMIN may grant SUPER_ADMIN or touch another SUPER_ADMIN
 *  - a user may not change their own role or deactivate themselves
 */
export function checkEscalation(actor: AdminUser, opts: { targetId?: string; targetRole?: string; newRole?: string; newIsActive?: boolean }): EscalationCheck {
  if (!can(actor.role, "users.manage")) return { ok: false, message: "You do not have permission to manage users." };
  const actorIsSuper = actor.role === "SUPER_ADMIN";
  if (opts.newRole === "SUPER_ADMIN" && !actorIsSuper) return { ok: false, message: "Only a super admin can grant the super admin role." };
  if (opts.targetRole === "SUPER_ADMIN" && !actorIsSuper && opts.targetId !== actor.id) return { ok: false, message: "Only a super admin can edit another super admin." };
  if (opts.targetId && opts.targetId === actor.id) {
    if (opts.newRole && opts.newRole !== actor.role) return { ok: false, message: "You cannot change your own role." };
    if (opts.newIsActive === false) return { ok: false, message: "You cannot deactivate your own account." };
  }
  return { ok: true };
}

export function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export function getUserWithHistory(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { auditLogs: true, revisions: true, assignedEnquiries: true, ownedProgrammes: true, ownedPathways: true, newsArticles: true } },
    },
  });
}

export type CreateUserResult = { ok: true; user: { id: string; name: string; email: string; role: string; isActive: boolean }; temporaryPassword: string | null } | { ok: false; status: 400 | 403 | 409; message: string; errors?: Record<string, string> };

/** Shared by the server action and POST /api/admin/users. Caller records the audit row. */
export async function createUserRecord(actor: AdminUser, input: CreateUserInput): Promise<CreateUserResult> {
  const esc = checkEscalation(actor, { newRole: input.role });
  if (!esc.ok) return { ok: false, status: 403, message: esc.message };
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) return { ok: false, status: 409, message: "A user with that email already exists.", errors: { email: "Already in use." } };
  const temporaryPassword = input.password ? null : generateTemporaryPassword();
  const passwordHash = await hashPassword(input.password || temporaryPassword!);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, role: input.role, passwordHash },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  return { ok: true, user, temporaryPassword };
}
