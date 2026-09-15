"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordAudit, createRevision } from "@/lib/audit";
import { guard, requestIp } from "./guard";
import { CreateUserSchema, UpdateUserSchema, checkEscalation, createUserRecord, generateTemporaryPassword, hashPassword } from "./users";
import { bool, str, zodErrors } from "./form";
import { fail, succeed, type ActionState } from "./types";

const Id = z.string().min(1).max(64);

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("users.manage");
  if (!g.ok) return fail(g.message);
  const parsed = CreateUserSchema.safeParse({ name: str(formData, "name"), email: str(formData, "email"), role: str(formData, "role"), password: str(formData, "password") });
  if (!parsed.success) return fail("Please fix the highlighted fields.", zodErrors(parsed.error));
  const r = await createUserRecord(g.user, parsed.data);
  if (!r.ok) return fail(r.message, r.errors);
  await recordAudit({ actorId: g.user.id, action: "CREATE", entityType: "User", entityId: r.user.id, afterJson: JSON.stringify(r.user), ip: await requestIp() });
  revalidatePath("/admin/users");
  if (r.temporaryPassword) {
    // Shown once on the form result; never persisted or logged.
    return succeed(`User created. Share this temporary password securely — it will not be shown again.`, { temporaryPassword: r.temporaryPassword, userId: r.user.id, email: r.user.email });
  }
  redirect(`/admin/users/${r.user.id}`);
}

export async function updateUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("users.manage");
  if (!g.ok) return fail(g.message);
  const parsed = UpdateUserSchema.safeParse({ id: str(formData, "id"), name: str(formData, "name"), role: str(formData, "role"), isActive: bool(formData, "isActive") });
  if (!parsed.success) return fail("Please fix the highlighted fields.", zodErrors(parsed.error));
  const { id, name, role, isActive } = parsed.data;
  const before = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, isActive: true } });
  if (!before) return fail("User not found.");
  const esc = checkEscalation(g.user, { targetId: id, targetRole: before.role, newRole: role, newIsActive: isActive });
  if (!esc.ok) return fail(esc.message);
  await createRevision({ entityType: "User", entityId: id, snapshot: before, authorId: g.user.id });
  const after = await prisma.user.update({ where: { id }, data: { name, role, isActive }, select: { id: true, name: true, email: true, role: true, isActive: true } });
  await recordAudit({ actorId: g.user.id, action: "UPDATE", entityType: "User", entityId: id, beforeJson: JSON.stringify(before), afterJson: JSON.stringify(after), ip: await requestIp() });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return succeed("User saved.");
}

export async function resetUserPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("users.manage");
  if (!g.ok) return fail(g.message);
  const id = Id.safeParse(str(formData, "id"));
  if (!id.success) return fail("User not found.");
  const target = await prisma.user.findUnique({ where: { id: id.data }, select: { id: true, role: true, email: true } });
  if (!target) return fail("User not found.");
  const esc = checkEscalation(g.user, { targetId: target.id, targetRole: target.role });
  if (!esc.ok) return fail(esc.message);
  const temporaryPassword = generateTemporaryPassword();
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await hashPassword(temporaryPassword) } });
  await recordAudit({ actorId: g.user.id, action: "UPDATE", entityType: "User", entityId: target.id, afterJson: JSON.stringify({ passwordReset: true }), ip: await requestIp() });
  revalidatePath(`/admin/users/${target.id}`);
  return succeed("Password reset. Share this temporary password securely — it will not be shown again.", { temporaryPassword });
}

export async function deactivateUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("users.manage");
  if (!g.ok) return fail(g.message);
  const id = Id.safeParse(str(formData, "id"));
  if (!id.success) return fail("User not found.");
  const before = await prisma.user.findUnique({ where: { id: id.data }, select: { id: true, role: true, isActive: true, name: true, email: true } });
  if (!before) return fail("User not found.");
  const esc = checkEscalation(g.user, { targetId: before.id, targetRole: before.role, newIsActive: false });
  if (!esc.ok) return fail(esc.message);
  if (!before.isActive) return succeed("User is already deactivated.");
  await createRevision({ entityType: "User", entityId: before.id, snapshot: before, authorId: g.user.id });
  await prisma.user.update({ where: { id: before.id }, data: { isActive: false } });
  await recordAudit({ actorId: g.user.id, action: "UPDATE", entityType: "User", entityId: before.id, beforeJson: JSON.stringify({ isActive: true }), afterJson: JSON.stringify({ isActive: false }), ip: await requestIp() });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${before.id}`);
  return succeed("User deactivated. Their sessions will end within the session lifetime.");
}

/** Hard delete is only allowed for accounts with no history at all; otherwise deactivate. */
export async function deleteUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("users.manage");
  if (!g.ok) return fail(g.message);
  const id = Id.safeParse(str(formData, "id"));
  if (!id.success) return fail("User not found.");
  const before = await prisma.user.findUnique({
    where: { id: id.data },
    select: { id: true, role: true, name: true, email: true, isActive: true, _count: { select: { auditLogs: true, revisions: true, assignedEnquiries: true, ownedProgrammes: true, ownedPathways: true, newsArticles: true } } },
  });
  if (!before) return fail("User not found.");
  if (before.id === g.user.id) return fail("You cannot delete your own account.");
  const esc = checkEscalation(g.user, { targetId: before.id, targetRole: before.role });
  if (!esc.ok) return fail(esc.message);
  const history = Object.values(before._count).reduce((a, b) => a + b, 0);
  if (history > 0) return fail("This account has audit history or owns content, so it cannot be deleted. Deactivate it instead.");
  await prisma.user.delete({ where: { id: before.id } });
  await recordAudit({ actorId: g.user.id, action: "DELETE", entityType: "User", entityId: before.id, beforeJson: JSON.stringify({ name: before.name, email: before.email, role: before.role }), ip: await requestIp() });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
