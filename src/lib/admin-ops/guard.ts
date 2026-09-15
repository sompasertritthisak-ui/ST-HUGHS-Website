import "server-only";
import { headers } from "next/headers";
import { currentUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/rbac";

export type AdminUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export type GuardResult = { ok: true; user: AdminUser } | { ok: false; status: 401 | 403; message: string };

/**
 * Resolve the current session user and check a permission. Never throws:
 * server actions and route handlers turn the result into a response, pages
 * turn it into a redirect or an access-denied panel.
 */
export async function guard(permission: Permission): Promise<GuardResult> {
  const user = await currentUser();
  if (!user) return { ok: false, status: 401, message: "You need to sign in." };
  if (!can(user.role, permission)) return { ok: false, status: 403, message: "You do not have access to this area." };
  return { ok: true, user };
}

/** Best-effort client IP for audit rows (proxy header first). */
export async function requestIp(): Promise<string | null> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]?.trim() ?? null;
    return h.get("x-real-ip");
  } catch {
    return null;
  }
}
