import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { getEntity } from "@/lib/admin/registry";
import { performStatusChange } from "@/lib/admin/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ to: z.string().min(1).max(20) });
const ID_RE = /^[a-z0-9_-]{5,64}$/i;

/** POST { to } — same workflow rules as the CMS status panel. */
export async function POST(request: Request, ctx: { params: Promise<{ entity: string; id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { entity, id } = await ctx.params;
  const def = getEntity(entity);
  if (!def || !ID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Body must be { to: string }" }, { status: 400 });
  const result = await performStatusChange(user, def, id, body.data.to);
  return NextResponse.json(result, { status: result.ok ? 200 : result.message?.includes("permission") ? 403 : 400 });
}
