import { NextResponse } from "next/server";

/** GET /api/version — the id of the build this server is running. Open tabs compare it with their own. */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ build: process.env.NEXT_PUBLIC_BUILD_ID ?? null }, { headers: { "Cache-Control": "no-store" } });
}
