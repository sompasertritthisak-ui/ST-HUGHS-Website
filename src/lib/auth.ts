import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { cache } from "react";
import { z } from "zod";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { recordAudit } from "./audit";

/** "s***@pbis.edu.la": enough for the owner to recognise in server logs, never the full address. */
const maskEmail = (email: string) => email.replace(/^(.)[^@]*/, "$1***");

const CredentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

/**
 * A short fingerprint of the stored password hash, kept in the session token. Any password change or reset (CMS,
 * Your account, scripts/reset-password.mjs) changes the hash, so every session signed in with the old password ends.
 */
export const passwordVersion = (passwordHash: string) => createHash("sha256").update(passwordHash).digest("hex").slice(0, 32);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Staff login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || !user.isActive) {
          // Server log only (the form always says "Email or password is incorrect"): tells the owner which case it was.
          console.warn(`[auth] sign-in refused for ${maskEmail(email)}: ${user ? "account is deactivated" : "no account with this email in this database"}`);
          await recordAudit({ action: "LOGIN_FAILED", entityType: "User", afterJson: JSON.stringify({ email }) });
          return null;
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          console.warn(`[auth] sign-in refused for ${maskEmail(email)}: password does not match`);
          await recordAudit({ actorId: user.id, action: "LOGIN_FAILED", entityType: "User", entityId: user.id });
          return null;
        }
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await recordAudit({ actorId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });
        return { id: user.id, email: user.email, name: user.name, role: user.role, passwordVersion: passwordVersion(user.passwordHash) };
      },
    }),
  ],
});

/** The account as it is in the database now (once per request). */
const loadAccount = cache((id: string) =>
  prisma.user.findUnique({ where: { id }, select: { email: true, name: true, role: true, isActive: true, passwordHash: true } }),
);

/**
 * Server helper: current session user or null. Checked against the database on every request, so deactivating an
 * account, changing its role or resetting its password takes effect immediately, not when the 8-hour session ends.
 */
export async function currentUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const account = await loadAccount(id);
  if (!account?.isActive || session.passwordVersion !== passwordVersion(account.passwordHash)) return null;
  return { id, email: account.email, name: account.name, role: account.role };
}
