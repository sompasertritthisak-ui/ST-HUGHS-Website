import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; role?: string };
    /** Fingerprint of the password hash at sign-in (see passwordVersion in src/lib/auth.ts). */
    passwordVersion?: string;
  }
  interface User {
    role?: string;
  }
}
