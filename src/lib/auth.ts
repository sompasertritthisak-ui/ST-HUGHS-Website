import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { recordAudit } from "./audit";

const CredentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

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
          await recordAudit({ action: "LOGIN_FAILED", entityType: "User", afterJson: JSON.stringify({ email }) });
          return null;
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          await recordAudit({ actorId: user.id, action: "LOGIN_FAILED", entityType: "User", entityId: user.id });
          return null;
        }
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await recordAudit({ actorId: user.id, action: "LOGIN", entityType: "User", entityId: user.id });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});

/** Server helper: current session user or null. */
export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? "", role: session.user.role ?? "VIEWER" };
}
