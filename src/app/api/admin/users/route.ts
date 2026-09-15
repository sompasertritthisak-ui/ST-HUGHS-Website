import { NextResponse, type NextRequest } from "next/server";
import { recordAudit } from "@/lib/audit";
import { guard, requestIp } from "@/lib/admin-ops/guard";
import { CreateUserSchema, createUserRecord, listUsers } from "@/lib/admin-ops/users";
import { zodErrors } from "@/lib/admin-ops/form";

export const dynamic = "force-dynamic";

/** GET /api/admin/users — list (users.read). Never returns password hashes. */
export async function GET() {
  const g = await guard("users.read");
  if (!g.ok) return NextResponse.json({ error: g.message }, { status: g.status });
  const users = await listUsers();
  return NextResponse.json({ users }, { headers: { "Cache-Control": "private, no-store" } });
}

/**
 * POST /api/admin/users — create (users.manage). Body: { name, email, role, password? }.
 * Same escalation rules as the CMS form. If no password is supplied a temporary one is
 * generated and returned ONCE in the response body.
 */
export async function POST(req: NextRequest) {
  const g = await guard("users.manage");
  if (!g.ok) return NextResponse.json({ error: g.message }, { status: g.status });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed.", errors: zodErrors(parsed.error) }, { status: 400 });
  const r = await createUserRecord(g.user, parsed.data);
  if (!r.ok) return NextResponse.json({ error: r.message, errors: r.errors }, { status: r.status });
  await recordAudit({ actorId: g.user.id, action: "CREATE", entityType: "User", entityId: r.user.id, afterJson: JSON.stringify(r.user), ip: await requestIp() });
  return NextResponse.json({ user: r.user, temporaryPassword: r.temporaryPassword }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
