import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listRevisions } from "@/lib/audit";
import { getEntity } from "@/lib/admin/registry";
import { performRollback } from "@/lib/admin/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_RE = /^[a-z0-9_-]{5,64}$/i;
const Body = z.object({ revisionId: z.string().regex(ID_RE) });

async function resolve(ctx: { params: Promise<{ entity: string; id: string }> }) {
  const { entity, id } = await ctx.params;
  const def = getEntity(entity);
  return def && ID_RE.test(id) ? { def, id } : null;
}

/** GET — revision list (metadata + snapshot). Requires content.read. */
export async function GET(_request: Request, ctx: { params: Promise<{ entity: string; id: string }> }) {
  const user = await currentUser();
  if (!user || !can(user.role, "content.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const target = await resolve(ctx);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const revisions = await listRevisions(target.def.type, target.id);
  return NextResponse.json({ revisions: revisions.map((r) => ({ id: r.id, version: r.version, note: r.note, createdAt: r.createdAt, author: r.author?.name ?? null, snapshot: JSON.parse(r.snapshotJson) as unknown })) });
}

/** POST { revisionId } — rollback. Requires content.rollback. */
export async function POST(request: Request, ctx: { params: Promise<{ entity: string; id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const target = await resolve(ctx);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Body must be { revisionId: string }" }, { status: 400 });
  const result = await performRollback(user, target.def, target.id, body.data.revisionId);
  return NextResponse.json(result, { status: result.ok ? 200 : result.message?.includes("permission") ? 403 : 400 });
}
