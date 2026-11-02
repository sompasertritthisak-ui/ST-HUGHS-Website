import { slidingWindow } from "../lib/rate-limit-core";

/**
 * RateLimiter Durable Object: one instance per rate-limit key (for example "login:203.0.113.5"), wherever in the
 * world the request lands. Cloudflare runs each instance one request at a time, so the count is exact even when many
 * requests arrive at once, and it is saved in the object's storage, so it survives restarts and deploys.
 *
 * Cost: one Durable Object request per check (blocked keys are answered by the site from memory, see
 * src/lib/rate-limit-core.ts), two rows written per allowed hit, and an alarm that deletes the key's data once its
 * window has passed, so storage never grows.
 *
 * Exported from custom-worker.js; bound as RATE_LIMITER in wrangler.jsonc.
 */

type Storage = {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  deleteAll(): Promise<void>;
  setAlarm(scheduledTime: number): Promise<void>;
};
type State = { storage: Storage; blockConcurrencyWhile<T>(fn: () => Promise<T>): Promise<T> };

const MAX_LIMIT = 10_000;
const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;

export class RateLimiter {
  private hits: number[] = [];

  constructor(private readonly state: State) {
    void state.blockConcurrencyWhile(async () => {
      this.hits = (await state.storage.get<number[]>("hits")) ?? [];
    });
  }

  async fetch(request: Request): Promise<Response> {
    let body: { limit?: unknown; windowMs?: unknown };
    try {
      body = await request.json();
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    const { limit, windowMs } = body;
    if (!Number.isInteger(limit) || !Number.isInteger(windowMs) || (limit as number) < 1 || (limit as number) > MAX_LIMIT || (windowMs as number) < 1 || (windowMs as number) > MAX_WINDOW_MS) {
      return new Response("Bad request", { status: 400 });
    }
    const now = Date.now();
    const { result, hits } = slidingWindow(this.hits, now, limit as number, windowMs as number);
    this.hits = hits;
    if (result.ok) {
      await this.state.storage.put("hits", hits);
      await this.state.storage.setAlarm(now + (windowMs as number)); // replaces the previous alarm
    }
    return Response.json(result);
  }

  /** Fires one window after the last allowed hit: every hit has expired, so forget the key. */
  async alarm() {
    this.hits = [];
    await this.state.storage.deleteAll();
  }
}
