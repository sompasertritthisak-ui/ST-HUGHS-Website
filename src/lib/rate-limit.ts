import { LocalLimiter, sharedLimit, type LimitResult, type RateLimiterNamespace } from "./rate-limit-core";

export type { LimitResult } from "./rate-limit-core";

/**
 * Rate limits that hold on Cloudflare Workers without running up the bill.
 *
 * - `rateLimit` (sign-in, password change, enquiry forms, uploads): an exact count per key shared by every Cloudflare
 *   server, kept in the RateLimiter Durable Object (src/workers/rate-limiter.ts), so it survives restarts and many
 *   requests at once. One Durable Object request per check (Workers Paid includes 1 million a month); once a key is
 *   blocked, each server answers from memory for free. If the Durable Object is slow or unreachable, the local count
 *   decides, so a check never fails or hangs a request.
 * - `burstLimit` (search, analytics: high volume, low stakes): Cloudflare's built-in rate limiter, which costs nothing
 *   extra and counts per Cloudflare location. The limits live in wrangler.jsonc ("ratelimits"); the arguments here are
 *   the same numbers, used locally.
 * - Local development (plain Node): an in-memory sliding window.
 */

const local = new LocalLimiter();

const isWorkersRuntime = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

type BurstBinding = { limit(options: { key: string }): Promise<{ success: boolean }> };

async function binding<T>(name: string): Promise<T | null> {
  if (!isWorkersRuntime) return null;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return ((env as unknown as Record<string, unknown>)[name] as T | undefined) ?? null;
  } catch {
    return null;
  }
}

/** Exact, shared limit: at most `limit` hits per `windowMs` for `key`, counted across all servers. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<LimitResult> {
  return sharedLimit(await binding<RateLimiterNamespace>("RATE_LIMITER"), local, key, limit, windowMs);
}

/** Cheap flood guard for busy public endpoints (see the note above). `windowMs` must be 10 s or 60 s on Cloudflare. */
export async function burstLimit(name: "SEARCH_LIMITER" | "ANALYTICS_LIMITER", key: string, limit: number, windowMs: number): Promise<LimitResult> {
  const limiter = await binding<BurstBinding>(name);
  if (!limiter) return local.limit(`${name}:${key}`, limit, windowMs);
  try {
    const { success } = await limiter.limit({ key });
    return success ? { ok: true, remaining: 1 } : { ok: false, retryAfterMs: windowMs };
  } catch {
    return local.limit(`${name}:${key}`, limit, windowMs);
  }
}

/**
 * The visitor's IP. On Cloudflare, cf-connecting-ip is set by Cloudflare and cannot be forged; the first
 * x-forwarded-for hop can be (a client may send its own header), so it is only used elsewhere (local development).
 */
export function clientIp(headers: Headers) {
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
