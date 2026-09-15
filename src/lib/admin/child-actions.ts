"use server";

import { revalidatePath } from "next/cache";
import { createRevision, recordAudit } from "@/lib/audit";
import { delegate } from "./delegate";
import { getChild, getEntity } from "./registry";
import { parseFormData, serialize } from "./schema";
import { actionUser, requestIp } from "./session";
import { DENIED, NOT_FOUND, friendlyDbError, revalidateFor } from "./workflow";
import type { ActionState } from "./types";

/** Inline child rows (programme modules, pathway steps). Always scoped to a parent record. */

const ID_RE = /^[a-z0-9_-]{5,64}$/i;

async function context(entityKey: string, childKey: string, parentId: string) {
  const def = getEntity(entityKey);
  const child = def ? getChild(def, childKey) : null;
  if (!def || !child || !ID_RE.test(parentId)) return null;
  const parent = await delegate(def.delegate).findUnique({ where: { id: parentId } });
  if (!parent) return null;
  return { def, child, parent };
}

export async function saveChild(entityKey: string, childKey: string, parentId: string, childId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await actionUser("content.update");
  if (!user) return DENIED;
  const ctx = await context(entityKey, childKey, parentId);
  if (!ctx) return NOT_FOUND;
  const { def, child, parent } = ctx;
  const parsed = parseFormData(child.fields, formData);
  if (!parsed.ok) return { ok: false, message: "Please fix the highlighted fields.", errors: parsed.errors };
  const data = serialize(child.fields, parsed.data);
  const d = delegate(child.delegate);
  try {
    await createRevision({ entityType: def.type, entityId: parentId, snapshot: await fullParent(def.delegate, child.key, parentId), authorId: user.id, note: `${childId ? "Edit" : "Add"} ${child.labelSingular.toLowerCase()}` });
    if (childId) {
      if (!ID_RE.test(childId)) return NOT_FOUND;
      const existing = await d.findFirst({ where: { id: childId, [child.parentField]: parentId } });
      if (!existing) return NOT_FOUND;
      const saved = await d.update({ where: { id: childId }, data });
      await recordAudit({ actorId: user.id, action: "UPDATE", entityType: def.type, entityId: parentId, beforeJson: JSON.stringify(existing), afterJson: JSON.stringify(saved), ip: await requestIp() });
    } else {
      const order = await d.count({ where: { [child.parentField]: parentId } });
      const saved = await d.create({ data: { ...data, [child.parentField]: parentId, order } });
      await recordAudit({ actorId: user.id, action: "CREATE", entityType: def.type, entityId: parentId, afterJson: JSON.stringify(saved), ip: await requestIp() });
    }
  } catch (error) {
    return friendlyDbError(error);
  }
  revalidateFor(def, parent);
  revalidatePath(`/admin/${def.key}/${parentId}`);
  return { ok: true, message: `${child.labelSingular} saved.` };
}

export async function moveChild(entityKey: string, childKey: string, parentId: string, childId: string, direction: "up" | "down", _prev: ActionState): Promise<ActionState> {
  void _prev; // required by useActionState signature
  const user = await actionUser("content.update");
  if (!user) return DENIED;
  const ctx = await context(entityKey, childKey, parentId);
  if (!ctx || !ID_RE.test(childId)) return NOT_FOUND;
  const { def, child, parent } = ctx;
  const d = delegate(child.delegate);
  const rows = await d.findMany({ where: { [child.parentField]: parentId }, orderBy: { order: "asc" } });
  const index = rows.findIndex((r) => r.id === childId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return { ok: true };
  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  try {
    for (const [i, row] of reordered.entries()) await d.update({ where: { id: row.id }, data: { order: i } });
  } catch (error) {
    return friendlyDbError(error);
  }
  revalidateFor(def, parent);
  revalidatePath(`/admin/${def.key}/${parentId}`);
  return { ok: true, message: `${child.labelSingular} moved.` };
}

export async function deleteChild(entityKey: string, childKey: string, parentId: string, childId: string, _prev: ActionState): Promise<ActionState> {
  void _prev; // required by useActionState signature
  const user = await actionUser("content.update");
  if (!user) return DENIED;
  const ctx = await context(entityKey, childKey, parentId);
  if (!ctx || !ID_RE.test(childId)) return NOT_FOUND;
  const { def, child, parent } = ctx;
  const d = delegate(child.delegate);
  const existing = await d.findFirst({ where: { id: childId, [child.parentField]: parentId } });
  if (!existing) return NOT_FOUND;
  try {
    await createRevision({ entityType: def.type, entityId: parentId, snapshot: await fullParent(def.delegate, child.key, parentId), authorId: user.id, note: `Delete ${child.labelSingular.toLowerCase()}` });
    await d.delete({ where: { id: childId } });
    const rest = await d.findMany({ where: { [child.parentField]: parentId }, orderBy: { order: "asc" } });
    for (const [i, row] of rest.entries()) await d.update({ where: { id: row.id }, data: { order: i } });
    await recordAudit({ actorId: user.id, action: "DELETE", entityType: def.type, entityId: parentId, beforeJson: JSON.stringify(existing), ip: await requestIp() });
  } catch (error) {
    return friendlyDbError(error);
  }
  revalidateFor(def, parent);
  revalidatePath(`/admin/${def.key}/${parentId}`);
  return { ok: true, message: `${child.labelSingular} deleted.` };
}

function fullParent(delegateName: Parameters<typeof delegate>[0], childKey: string, parentId: string) {
  return delegate(delegateName).findUnique({ where: { id: parentId }, include: { [childKey]: { orderBy: { order: "asc" } } } });
}
