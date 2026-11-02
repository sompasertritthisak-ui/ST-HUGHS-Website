"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./types";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
});

const GENERIC = "Email or password is incorrect.";

const tooMany = (retryAfterMs: number): ActionState => ({ ok: false, message: `Too many attempts. Try again in ${Math.ceil(retryAfterMs / 60_000)} minutes.` });

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ip = clientIp(await headers());
  const limit = await rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterMs);

  const parsed = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: GENERIC };
  // Guessing one account's password from many IPs: a higher per-account limit, so a real user is rarely held up.
  const perAccount = await rateLimit(`login-account:${parsed.data.email}`, 30, 15 * 60 * 1000);
  if (!perAccount.ok) return tooMany(perAccount.retryAfterMs);

  let ok = false;
  try {
    const result: unknown = await signIn("credentials", { ...parsed.data, redirect: false });
    ok = typeof result === "string" || result === undefined;
  } catch {
    ok = false;
  }
  if (!ok) return { ok: false, message: GENERIC };
  redirect("/admin");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
