/**
 * In-memory sliding window rate limiter. Suitable for a single instance; swap
 * for Redis/Upstash in a multi-instance deployment (same interface).
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const nowTs = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => nowTs - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return { ok: false as const, retryAfterMs: windowMs - (nowTs - arr[0]) };
  }
  arr.push(nowTs);
  buckets.set(key, arr);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.every((t) => nowTs - t > windowMs)) buckets.delete(k);
  }
  return { ok: true as const, remaining: limit - arr.length };
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
