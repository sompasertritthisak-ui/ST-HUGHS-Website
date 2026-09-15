import { NextResponse } from "next/server";
import { TrackEventSchema, trackEvent } from "@/lib/analytics";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { rateLimited, readBody } from "../../_lib/respond";

/**
 * POST /api/analytics/events — first-party event ingestion.
 * Accepts JSON regardless of content-type (navigator.sendBeacon often sends text/plain).
 * 204 on success · 400 on invalid payload · 429 when over 60 events/minute per IP.
 * Never returns stored data.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANALYTICS_RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 } as const;

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`analytics:${ip}`, ANALYTICS_RATE_LIMIT.limit, ANALYTICS_RATE_LIMIT.windowMs);
  if (!rl.ok) return rateLimited(rl.retryAfterMs);

  const raw = await readBody(req, 8 * 1024);
  if (raw === null) return new NextResponse(null, { status: 400, headers: NO_STORE });

  const parsed = TrackEventSchema.safeParse(raw);
  if (!parsed.success) return new NextResponse(null, { status: 400, headers: NO_STORE });

  try {
    await trackEvent(parsed.data);
  } catch (error) {
    // Analytics must never surface errors to visitors.
    console.error("analytics.track failed", error);
  }
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}
