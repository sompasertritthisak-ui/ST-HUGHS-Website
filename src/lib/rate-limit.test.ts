// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit, clientIp } from "./rate-limit";

afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("allows up to the limit then blocks with a retryAfter", () => {
    const key = `t:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const r = rateLimit(key, 3, 1000);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.remaining).toBe(2 - i);
    }
    const blocked = rateLimit(key, 3, 1000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(1000);
    }
  });

  it("slides the window: old hits expire", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const key = `t:${Math.random()}`;
    rateLimit(key, 2, 1000);
    rateLimit(key, 2, 1000);
    expect(rateLimit(key, 2, 1000).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, 2, 1000).ok).toBe(true);
  });

  it("keeps keys independent", () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    rateLimit(a, 1, 1000);
    expect(rateLimit(a, 1, 1000).ok).toBe(false);
    expect(rateLimit(b, 1, 1000).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for hop", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
  });
  it("falls back to x-real-ip then 'unknown'", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
