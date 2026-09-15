import { NextResponse, type NextRequest } from "next/server";
import { guard } from "@/lib/admin-ops/guard";
import { getAnalyticsSummary, parseRange } from "@/lib/admin-ops/analytics";

export const dynamic = "force-dynamic";

/** GET /api/admin/analytics?range=7|30|90 — same JSON the /admin/analytics page renders. */
export async function GET(req: NextRequest) {
  const g = await guard("analytics.read");
  if (!g.ok) return NextResponse.json({ error: g.message }, { status: g.status });
  const range = parseRange(req.nextUrl.searchParams.get("range") ?? undefined);
  const data = await getAnalyticsSummary(range);
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
