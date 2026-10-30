import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Kept as Edge "middleware" (deprecated name in Next 16) rather than Node "proxy": OpenNext on Cloudflare Workers
// runs Edge middleware. Next 16 needs a plain default export to recognise it.
const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
