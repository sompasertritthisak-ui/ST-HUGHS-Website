import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration (no database access). Used by middleware.
 * The full configuration with the Credentials provider lives in `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined;
        session.user.id = (token.uid as string | undefined) ?? "";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";
      const isAdminApi = pathname.startsWith("/api/admin");
      if (isAdminArea || isAdminApi) return Boolean(auth?.user);
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
