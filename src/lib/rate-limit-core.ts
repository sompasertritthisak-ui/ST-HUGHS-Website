/**
 * Rate-limit logic shared by the site (src/lib/rate-limit.ts) and the RateLimiter Durable Object
 * (src/workers/rate-limiter.ts). No Next.js or Cloudflare imports, so both bundles can use it.
 */

export type LimitResult = { ok: true; remaining: number } | { ok: false; retryAfterMs: number };

/** Sliding window over the timestamps of allowed hits. Pure: returns the result and the hits to keep. */
export function slidingWindow(hits: readonly number[], now: number, limit: number, windowMs: number): { result: LimitResult; hits: number[] } {
  const live = hits.filter((t) => now - t < windowMs);
  if (live.length >= limit) return { result: { ok: false, retryAfterMs: Math.max(1, windowMs - (now - live[0])) }, hits: live };
  live.push(now);
  return { result: { ok: true, remaining: limit - live.length }, hits: live };
}

/** In-memory counts for one server (one Worker isolate, or the single Node process in development). */
export class LocalLimiter {
  private buckets = new Map<string, number[]>();
  private blocked = new Map<string, number>(); // key → time the shared limiter said it unblocks

  /** Count and decide here (development, or when the shared limiter cannot be reached). */
  limit(key: string, limit: number, windowMs: number, now = Date.now()): LimitResult {
    const { result, hits } = slidingWindow(this.buckets.get(key) ?? [], now, limit, windowMs);
    this.store(key, hits, now, windowMs);
    return result;
  }

  /**
   * Answer without asking the shared limiter when the answer is already known to be "blocked": either it said so
   * recently, or this server alone has already let `limit` hits through (the shared count can only be higher).
   */
  knownBlocked(key: string, limit: number, windowMs: number, now = Date.now()): LimitResult | null {
    const until = this.blocked.get(key);
    if (until !== undefined) {
      if (until > now) return { ok: false, retryAfterMs: until - now };
      this.blocked.delete(key);
    }
    const live = (this.buckets.get(key) ?? []).filter((t) => now - t < windowMs);
    return live.length >= limit ? { ok: false, retryAfterMs: Math.max(1, windowMs - (now - live[0])) } : null;
  }

  /** Mirror a shared decision locally. */
  remember(key: string, result: LimitResult, windowMs: number, now = Date.now()) {
    if (result.ok) {
      const hits = (this.buckets.get(key) ?? []).filter((t) => now - t < windowMs);
      hits.push(now);
      this.store(key, hits, now, windowMs);
    } else {
      this.blocked.set(key, now + result.retryAfterMs);
    }
  }

  private store(key: string, hits: number[], now: number, windowMs: number) {
    this.buckets.set(key, hits);
    if (this.buckets.size > 10_000) {
      for (const [k, v] of this.buckets) if (v.every((t) => now - t >= windowMs)) this.buckets.delete(k);
    }
    if (this.blocked.size > 10_000) {
      for (const [k, until] of this.blocked) if (until <= now) this.blocked.delete(k);
    }
  }
}

/** The parts of a Durable Object namespace binding this module uses. */
export type RateLimiterNamespace = {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(input: string, init?: RequestInit): Promise<Response> };
};

/**
 * How long a request waits for the shared limiter before the local count decides instead. Generous on purpose:
 * usual answers take 15–250 ms, but on a cold start the same request is also loading the site's code, and 1.5 s
 * timed out in production (Laos → the Durable Object's location).
 */
export const SHARED_TIMEOUT_MS = 4000;

/**
 * One exact count per key across every Cloudflare server, kept in the RateLimiter Durable Object.
 * Never throws and never waits more than SHARED_TIMEOUT_MS: if the Durable Object is missing, slow or failing,
 * the local count decides.
 */
export async function sharedLimit(
  namespace: RateLimiterNamespace | null,
  local: LocalLimiter,
  key: string,
  limit: number,
  windowMs: number,
): Promise<LimitResult> {
  if (!namespace) return local.limit(key, limit, windowMs);
  const known = local.knownBlocked(key, limit, windowMs);
  if (known) return known; // a flood from one key stops here: no Durable Object request, almost no CPU
  try {
    const stub = namespace.get(namespace.idFromName(key));
    const res = await stub.fetch("https://rate-limiter/hit", {
      method: "POST",
      body: JSON.stringify({ limit, windowMs }),
      signal: AbortSignal.timeout(SHARED_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`rate limiter answered ${res.status}`);
    const result = (await res.json()) as LimitResult;
    local.remember(key, result, windowMs);
    return result;
  } catch (err) {
    console.warn("[rate-limit] shared limiter unavailable, using the local count:", err instanceof Error ? err.message : err);
    return local.limit(key, limit, windowMs);
  }
}
