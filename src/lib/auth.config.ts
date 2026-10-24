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
      if (auth?.user || (!isAdminArea && !isAdminApi)) return true;
      // Signed-out visitors to CMS pages go straight to the login page on the PUBLIC host. Auth.js's default redirect
      // embedded the server's internal address (https://0.0.0.0:3000) as a callbackUrl — never used (login always
      // lands on the dashboard) but visible in the address bar. Behind Railway/Cloudflare the public host arrives in
      // the forwarded headers; locally they fall back to the request URL.
      if (isAdminArea) {
        const h = request.headers;
        const host = h?.get("x-forwarded-host")?.split(",")[0]?.trim() || h?.get("host") || request.nextUrl.host;
        const proto = h?.get("x-forwarded-proto")?.split(",")[0]?.trim() || request.nextUrl.protocol.replace(":", "");
        return Response.redirect(`${proto}://${host}/admin/login`, 307);
      }
      return false;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
