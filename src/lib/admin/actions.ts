"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { createRevision, recordAudit } from "@/lib/audit";
import { toSlug } from "@/lib/utils";
import { delegate } from "./delegate";
import { getEntity, entityHref } from "./registry";
import { parseFormData, serialize } from "./schema";
import { actionUser, requestIp } from "./session";
import { DENIED, NOT_FOUND, friendlyDbError, performRollback, performStatusChange, revalidateFor } from "./workflow";
import type { ActionState, AdminRecord } from "./types";

/** Create or update an entity. Bound as `saveEntity.bind(null, entityKey, id)`. */
export async function saveEntity(entityKey: string, id: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const def = getEntity(entityKey);
  if (!def) return NOT_FOUND;
  const user = await actionUser(id ? "content.update" : "content.create");
  if (!user) return DENIED;

  const parsed = parseFormData(def.fields, formData);
  if (!parsed.ok) return { ok: false, message: "Please fix the highlighted fields.", errors: parsed.errors };
  const data = serialize(def.fields, parsed.data);

  const slugField = def.fields.find((f) => f.type === "slug");
  if (slugField && !data[slugField.name]) {
    const base = data[def.titleField];
    data[slugField.name] = toSlug(typeof base === "string" && base ? base : `item-${Date.now()}`);
  }

  const d = delegate(def.delegate);
  const existing = id ? await d.findUnique({ where: { id } }) : null;
  if (id && !existing) return NOT_FOUND;

  const guard = def.guardSave?.(data, existing);
  if (guard) return { ok: false, message: guard };

  let saved: AdminRecord;
  try {
    if (existing) {
      await createRevision({ entityType: def.type, entityId: existing.id, snapshot: existing, authorId: user.id, note: "Before update" });
      saved = await d.update({ where: { id: existing.id }, data });
      await recordAudit({ actorId: user.id, action: "UPDATE", entityType: def.type, entityId: saved.id, beforeJson: JSON.stringify(existing), afterJson: JSON.stringify(saved), ip: await requestIp() });
    } else {
      saved = await d.create({ data: { ...data, ...(def.hasStatus ? { status: "DRAFT" } : {}) } });
      await recordAudit({ actorId: user.id, action: "CREATE", entityType: def.type, entityId: saved.id, afterJson: JSON.stringify(saved), ip: await requestIp() });
    }
  } catch (error) {
    return friendlyDbError(error);
  }
  revalidateFor(def, existing, saved);
  if (!existing) redirect(`${entityHref(def, saved.id)}?created=1`);
  revalidatePath(entityHref(def, saved.id));
  return { ok: true, message: "Saved.", id: saved.id };
}

export async function deleteEntity(entityKey: string, id: string, _prev: ActionState): Promise<ActionState> {
  void _prev; // required by useActionState signature
  const def = getEntity(entityKey);
  if (!def) return NOT_FOUND;
  const user = await actionUser("content.delete");
  if (!user) return DENIED;
  const d = delegate(def.delegate);
  const existing = await d.findUnique({ where: { id } });
  if (!existing) return NOT_FOUND;
  try {
    await createRevision({ entityType: def.type, entityId: id, snapshot: existing, authorId: user.id, note: "Before delete" });
    await d.delete({ where: { id } });
    await recordAudit({ actorId: user.id, action: "DELETE", entityType: def.type, entityId: id, beforeJson: JSON.stringify(existing), ip: await requestIp() });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, message: "This item is referenced by other content. Archive it instead, or remove the references first." };
    }
    return friendlyDbError(error);
  }
  revalidateFor(def, existing);
  redirect(`/admin/${def.key}?deleted=1`);
}

export async function changeStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const def = getEntity(String(formData.get("entity") ?? ""));
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!def || !/^[a-z0-9_-]{5,64}$/i.test(id)) return NOT_FOUND;
  const user = await actionUser("content.read");
  if (!user) return DENIED;
  return performStatusChange(user, def, id, to);
}

export async function restoreRevision(entityKey: string, id: string, revisionId: string, _prev: ActionState): Promise<ActionState> {
  void _prev; // required by useActionState signature
  const def = getEntity(entityKey);
  if (!def) return NOT_FOUND;
  const user = await actionUser("content.rollback");
  if (!user) return DENIED;
  return performRollback(user, def, id, revisionId);
}
