import { NextResponse } from "next/server";
import { searchSite } from "@/lib/search";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { rateLimited } from "../_lib/respond";

/** GET /api/search?q= — ranked public content for the header search dialog. Read-only; published content only. */
export async function GET(req: Request) {
  const limited = rateLimit(`search:${clientIp(req.headers)}`, 120, 60_000);
  if (!limited.ok) return rateLimited(limited.retryAfterMs);
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 120);
  const hits = await searchSite(q, 24);
  return NextResponse.json(
    { ok: true, q, hits: hits.map(({ kind, title, href, summary, meta }) => ({ kind, title, href, summary, meta })) },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
