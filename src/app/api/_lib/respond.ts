import { NextResponse } from "next/server";
import type { FieldErrors } from "@/lib/schemas/enquiry";

/** Public read cache policy: 5 minutes at the edge, serve stale while revalidating. */
export const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
} as const;

/** Consistent list envelope for public read APIs. */
export function listResponse<T>(data: T[], extraMeta: Record<string, unknown> = {}) {
  return NextResponse.json({ data, meta: { count: data.length, ...extraMeta } }, { headers: PUBLIC_CACHE_HEADERS });
}

/** Consistent single-item envelope; 404 when missing (never reveals unpublished existence). */
export function itemResponse<T>(data: T | null | undefined) {
  if (!data) {
    return NextResponse.json({ data: null, meta: { count: 0 }, error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ data, meta: { count: 1 } }, { headers: PUBLIC_CACHE_HEADERS });
}

export function validationError(errors: FieldErrors, status: 400 | 422 = 422) {
  return NextResponse.json({ ok: false, errors }, { status, headers: { "Cache-Control": "no-store" } });
}

export function rateLimited(retryAfterMs: number) {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return NextResponse.json(
    { ok: false, errors: { _form: ["Too many requests. Please try again later."] } },
    { status: 429, headers: { "Retry-After": String(seconds), "Cache-Control": "no-store" } },
  );
}

/**
 * Read a request body as a plain object. Accepts JSON (any content-type,
 * including sendBeacon's text/plain), URL-encoded forms and multipart forms.
 * Returns null when the body cannot be parsed. Bodies over `maxBytes` are rejected.
 */
export async function readBody(req: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown> | null> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > maxBytes) return null;
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("multipart/form-data") || type.includes("application/x-www-form-urlencoded")) {
      const fd = await req.formData();
      const out: Record<string, unknown> = {};
      for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
      return out;
    }
    const text = await req.text();
    if (text.length > maxBytes) return null;
    if (!text.trim()) return {};
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Optional string query param, trimmed and length-capped. */
export function queryParam(url: URL, name: string, max = 120): string | undefined {
  const v = url.searchParams.get(name)?.trim();
  if (!v) return undefined;
  return v.slice(0, max);
}
