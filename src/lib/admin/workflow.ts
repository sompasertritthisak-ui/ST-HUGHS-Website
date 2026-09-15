import "server-only";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { CONTENT_STATUSES, STATUS_TRANSITIONS, type ContentStatus } from "@/lib/enums";
import { can, canTransitionTo } from "@/lib/rbac";
import { createRevision, recordAudit, toWritableSnapshot } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { delegate } from "./delegate";
import { entityHref } from "./registry";
import { requestIp, type AdminUser } from "./session";
import type { ActionState, AdminRecord, EntityDef } from "./types";

/**
 * Workflow + rollback core. Lives outside the "use server" module so these
 * functions (which take a trusted user) are never exposed as action endpoints.
 */

export const DENIED: ActionState = { ok: false, message: "You do not have permission to do that." };
export const NOT_FOUND: ActionState = { ok: false, message: "Record not found." };

export function revalidateFor(def: EntityDef, ...records: (AdminRecord | null)[]) {
  const paths = new Set<string>([`/admin/${def.key}`]);
  for (const r of records) if (r) for (const p of def.publicPaths(r)) paths.add(p);
  for (const p of paths) revalidatePath(p);
}

export function friendlyDbError(error: unknown): ActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? (error.meta.target as string[]) : [];
      const field = target.find((t) => typeof t === "string") ?? "slug";
      return { ok: false, message: "That value is already in use.", errors: { [field]: "Must be unique" } };
    }
    if (error.code === "P2003") return { ok: false, message: "A referenced item does not exist.", errors: {} };
    if (error.code === "P2025") return NOT_FOUND;
  }
  console.error("admin.action failed", error);
  return { ok: false, message: "Something went wrong. Nothing was saved." };
}

/** Core workflow transition, shared by the server action and the API route. */
export async function performStatusChange(user: AdminUser, def: EntityDef, id: string, to: string): Promise<ActionState> {
  if (!def.hasStatus) return { ok: false, message: "This content type has no workflow." };
  if (!CONTENT_STATUSES.includes(to as ContentStatus)) return { ok: false, message: "Unknown status." };
  const d = delegate(def.delegate);
  const existing = await d.findUnique({ where: { id } });
  if (!existing) return NOT_FOUND;
  const from = String(existing.status ?? "DRAFT") as ContentStatus;
  if (!(STATUS_TRANSITIONS[from] ?? []).includes(to as ContentStatus)) return { ok: false, message: `Cannot move from ${from} to ${to}.` };
  if (!canTransitionTo(user.role, to)) return DENIED;
  const guard = def.guardStatus?.(existing, to);
  if (guard) return { ok: false, message: guard };

  const data: Record<string, unknown> = { status: to };
  if (to === "PUBLISHED" && def.hasPublishAt && !existing.publishAt) data.publishAt = new Date();
  if (to === "PUBLISHED" && def.type === "NewsArticle" && !existing.publishedAt) data.publishedAt = new Date();

  let saved: AdminRecord;
  try {
    await createRevision({ entityType: def.type, entityId: id, snapshot: existing, authorId: user.id, note: `Status ${from} → ${to}` });
    saved = await d.update({ where: { id }, data });
  } catch (error) {
    return friendlyDbError(error);
  }
  const ip = await requestIp();
  const before = JSON.stringify({ status: from });
  const after = JSON.stringify({ status: to });
  await recordAudit({ actorId: user.id, action: "STATUS_CHANGE", entityType: def.type, entityId: id, beforeJson: before, afterJson: after, ip });
  if (to === "PUBLISHED") await recordAudit({ actorId: user.id, action: "PUBLISH", entityType: def.type, entityId: id, afterJson: JSON.stringify(saved), ip });
  if (from === "PUBLISHED" && to !== "PUBLISHED") await recordAudit({ actorId: user.id, action: "UNPUBLISH", entityType: def.type, entityId: id, beforeJson: JSON.stringify(existing), ip });
  revalidateFor(def, existing, saved);
  revalidatePath(entityHref(def, id));
  return { ok: true, message: `Status changed to ${to.replace("_", " ").toLowerCase()}.` };
}

/** Core rollback, shared by the server action and the API route. */
export async function performRollback(user: AdminUser, def: EntityDef, id: string, revisionId: string): Promise<ActionState> {
  if (!can(user.role, "content.rollback")) return DENIED;
  const revision = await prisma.revision.findUnique({ where: { id: revisionId } });
  if (!revision || revision.entityType !== def.type || revision.entityId !== id) return { ok: false, message: "Revision not found." };
  const d = delegate(def.delegate);
  const existing = await d.findUnique({ where: { id } });
  if (!existing) return NOT_FOUND;
  let snapshot: Record<string, unknown>;
  try {
    snapshot = JSON.parse(revision.snapshotJson) as Record<string, unknown>;
  } catch {
    return { ok: false, message: "Revision snapshot is unreadable." };
  }
  // Re-hydrate ISO date strings for date-typed columns and drop relations/system fields.
  const writable = toWritableSnapshot(snapshot, ["status"]);
  for (const field of def.fields) {
    if (field.type === "date" && typeof writable[field.name] === "string") writable[field.name] = new Date(writable[field.name] as string);
  }
  for (const key of Object.keys(writable)) {
    if (!(key in existing) || key === "id") delete writable[key];
    else if (writable[key] === null && def.fields.some((f) => f.name === key && f.nonNull)) writable[key] = "";
  }
  let saved: AdminRecord;
  try {
    await createRevision({ entityType: def.type, entityId: id, snapshot: existing, authorId: user.id, note: `Before rollback to v${revision.version}` });
    saved = await d.update({ where: { id }, data: writable });
  } catch (error) {
    return friendlyDbError(error);
  }
  await recordAudit({ actorId: user.id, action: "ROLLBACK", entityType: def.type, entityId: id, beforeJson: JSON.stringify(existing), afterJson: JSON.stringify(saved), ip: await requestIp() });
  revalidateFor(def, existing, saved);
  revalidatePath(entityHref(def, id));
  revalidatePath(`${entityHref(def, id)}/revisions`);
  return { ok: true, message: `Restored version ${revision.version}. Status was kept as ${String(existing.status ?? "")}.` };
}
