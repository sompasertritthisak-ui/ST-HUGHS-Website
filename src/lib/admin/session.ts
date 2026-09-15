import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { currentUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/rbac";
import { clientIp } from "@/lib/rate-limit";

export type AdminUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** Server-side guard for admin pages. Middleware also protects the route; this is the second check. */
export async function requireUser(): Promise<AdminUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** For server actions: return the user or null (never redirect inside an action). */
export async function actionUser(permission?: Permission): Promise<AdminUser | null> {
  const user = await currentUser();
  if (!user) return null;
  if (permission && !can(user.role, permission)) return null;
  return user;
}

export async function requestIp() {
  try {
    return clientIp(await headers());
  } catch {
    return null;
  }
}
