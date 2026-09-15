import { z } from "zod";

/** Turn Zod issues into `{ fieldName: message }` for `ActionState.errors`. */
export function zodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export function str(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
}

export function optStr(fd: FormData, name: string): string | undefined {
  const v = str(fd, name);
  return v === "" ? undefined : v;
}

export function bool(fd: FormData, name: string): boolean {
  const v = fd.get(name);
  return v === "on" || v === "true" || v === "1";
}

/** All non-empty values for a repeated field (e.g. several `phones` inputs). */
export function list(fd: FormData, name: string): string[] {
  return fd
    .getAll(name)
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** `YYYY-MM-DD` (or full ISO) → Date | null; invalid → undefined so Zod can flag it. */
export function dateOrNull(fd: FormData, name: string): Date | null | undefined {
  const v = str(fd, name);
  if (!v) return null;
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Read a single searchParam value. */
export function sp(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = params[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() !== "" ? s.trim() : undefined;
}

export function spInt(params: Record<string, string | string[] | undefined>, key: string, fallback: number, min = 1, max = 100_000): number {
  const raw = sp(params, key);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Relative path (`/…`) or https URL. Used by navigation + settings links. */
export const HrefSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(500)
  .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(v), {
    message: "Must be a relative path starting with / or an https:// URL",
  });

export const OptionalHttpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), { message: "Must be an https:// URL" })
  .optional()
  .default("");

/** Build a query string from a record, skipping empty values. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}
