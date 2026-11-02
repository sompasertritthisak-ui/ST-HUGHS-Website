// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit, clientIp } from "./rate-limit";
import { LocalLimiter, sharedLimit, slidingWindow, type RateLimiterNamespace } from "./rate-limit-core";
import { RateLimiter } from "@/workers/rate-limiter";

afterEach(() => vi.useRealTimers());

describe("rateLimit (local development: in memory)", () => {
  it("allows up to the limit then blocks with a retryAfter", async () => {
    const key = `t:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const r = await rateLimit(key, 3, 1000);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.remaining).toBe(2 - i);
    }
    const blocked = await rateLimit(key, 3, 1000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(1000);
    }
  });

  it("slides the window: old hits expire", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const key = `t:${Math.random()}`;
    await rateLimit(key, 2, 1000);
    await rateLimit(key, 2, 1000);
    expect((await rateLimit(key, 2, 1000)).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect((await rateLimit(key, 2, 1000)).ok).toBe(true);
  });

  it("keeps keys independent", async () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    await rateLimit(a, 1, 1000);
    expect((await rateLimit(a, 1, 1000)).ok).toBe(false);
    expect((await rateLimit(b, 1, 1000)).ok).toBe(true);
  });
});

describe("slidingWindow", () => {
  it("never keeps more than `limit` hits", () => {
    let hits: number[] = [];
    for (let i = 0; i < 50; i++) hits = slidingWindow(hits, 1000 + i, 5, 10_000).hits;
    expect(hits).toHaveLength(5);
  });
});

/** In-memory stand-in for a Durable Object's storage, plus a namespace that routes each key to one RateLimiter. */
function fakeNamespace() {
  const objects = new Map<string, RateLimiter>();
  const calls = { count: 0 };
  const ns: RateLimiterNamespace = {
    idFromName: (name) => name,
    get: (id) => ({
      fetch: async (input, init) => {
        calls.count++;
        let obj = objects.get(id as string);
        if (!obj) {
          const data = new Map<string, unknown>();
          obj = new RateLimiter({
            storage: {
              get: async <T,>(k: string) => data.get(k) as T | undefined,
              put: async (k, v) => void data.set(k, v),
              deleteAll: async () => data.clear(),
              setAlarm: async () => undefined,
            },
            blockConcurrencyWhile: (fn) => fn(),
          });
          objects.set(id as string, obj);
        }
        return obj.fetch(new Request(input, init));
      },
    }),
  };
  return { ns, calls };
}

describe("sharedLimit (Cloudflare: RateLimiter Durable Object)", () => {
  it("is exact across servers: two servers together still allow only `limit`", async () => {
    const { ns } = fakeNamespace();
    const serverA = new LocalLimiter();
    const serverB = new LocalLimiter();
    const results = await Promise.all(Array.from({ length: 40 }, (_, i) => sharedLimit(ns, i % 2 ? serverA : serverB, "login:1.2.3.4", 10, 60_000)));
    expect(results.filter((r) => r.ok)).toHaveLength(10);
  });

  it("answers a flood from memory once blocked (no extra Durable Object requests)", async () => {
    const { ns, calls } = fakeNamespace();
    const server = new LocalLimiter();
    for (let i = 0; i < 3; i++) await sharedLimit(ns, server, "k", 3, 60_000);
    for (let i = 0; i < 1000; i++) expect((await sharedLimit(ns, server, "k", 3, 60_000)).ok).toBe(false);
    expect(calls.count).toBe(3); // this server already let 3 through, so it knows the key is blocked
  });

  it("falls back to the local count when the Durable Object fails, instead of failing the request", async () => {
    const broken: RateLimiterNamespace = { idFromName: (n) => n, get: () => ({ fetch: () => Promise.reject(new Error("overloaded")) }) };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const server = new LocalLimiter();
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await sharedLimit(broken, server, "k", 3, 60_000));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false, false]);
    warn.mockRestore();
  });

  it("rejects nonsense limits sent to the Durable Object", async () => {
    const { ns } = fakeNamespace();
    const res = await ns.get(ns.idFromName("x")).fetch("https://rate-limiter/hit", { method: "POST", body: JSON.stringify({ limit: -1, windowMs: 5 }) });
    expect(res.status).toBe(400);
  });
});

describe("clientIp", () => {
  it("trusts Cloudflare's cf-connecting-ip over a client-sent x-forwarded-for", () => {
    expect(clientIp(new Headers({ "cf-connecting-ip": "198.51.100.7", "x-forwarded-for": "1.1.1.1, 198.51.100.7" }))).toBe("198.51.100.7");
  });
  it("uses the first x-forwarded-for hop when not on Cloudflare", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
  });
  it("falls back to x-real-ip then 'unknown'", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
