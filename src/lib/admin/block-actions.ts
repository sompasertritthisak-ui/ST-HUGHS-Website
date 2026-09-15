"use server";

import { revalidatePath } from "next/cache";
import { BLOCK_TYPES, type BlockType } from "@/lib/enums";
import { createRevision, recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { blockFields } from "./blocks";
import { getEntity } from "./registry";
import { parseFormData } from "./schema";
import { actionUser, requestIp } from "./session";
import { DENIED, NOT_FOUND, friendlyDbError } from "./workflow";
import type { ActionState } from "./types";

const ID_RE = /^[a-z0-9_-]{5,64}$/i;
const pageDef = () => getEntity("pages")!;

async function loadPage(pageId: string) {
  return prisma.page.findUnique({ where: { id: pageId }, include: { blocks: { orderBy: { order: "asc" } } } });
}

async function snapshotAndRevalidate(userId: string, pageId: string, action: "CREATE" | "UPDATE" | "DELETE", beforeJson: string | null, afterJson: string | null) {
  const page = await loadPage(pageId);
  if (!page) return;
  await recordAudit({ actorId: userId, action, entityType: "ContentBlock", entityId: pageId, beforeJson, afterJson, ip: await requestIp() });
  for (const p of pageDef().publicPaths(page)) revalidatePath(p);
  revalidatePath(`/admin/pages/${pageId}`);
}

export async function addBlock(pageId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await actionUser("content.update");
  if (!user) return DENIED;
  const type = String(formData.get("type") ?? "");
  if (!ID_RE.test(pageId) || !BLOCK_TYPES.includes(type as BlockType)) return { ok: false, message: "Choose a block type." };
  const page = await loadPage(pageId);
  if (!page) return NOT_FOUND;
  try {
    await createRevision({ entityType: "Page", entityId: pageId, snapshot: page, authorId: user.id, note: `Add ${type} block` });
    const block = await prisma.contentBlock.create({ data: { pageId, type, order: page.blocks.length, dataJson: "{}" } });
    await snapshotAndRevalidate(user.id, pageId, "CREATE", null, JSON.stringify(block));
  } catch (error) {
    return friendlyDbError(error);
  }
  return { ok: true, message: "Block added." };
}

export async function updateBlock(blockId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await actionUser("content.update");
  if (!user) return DENIED;
  if (!ID_RE.test(blockId)) return NOT_FOUND;
  const block = await prisma.contentBlock.findUnique({ where: { id: blockId } });
  if (!block) return NOT_FOUND;

  let data: Record<string, unknown>;
  if (formData.get("mode") === "json") {
    try {
      const parsed: unknown = JSON.parse(String(formData.get("dataJson") ?? "{}"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, message: "Block data must be a JSON object.", errors: { dataJson: "Must be a JSON object" } };
      data = parsed as Record<string, unknown>;
    } catch {
      return { ok: false, message: "Invalid JSON.", errors: { dataJson: "Must be valid JSON" } };
    }
  } else {
    const parsed = parseFormData(blockFields(block.type), formData);
    if (!parsed.ok) return { ok: false, message: "Please fix the highlighted fields.", errors: parsed.errors };
    let current: Record<string, unknown> = {};
    try {
      current = JSON.parse(block.dataJson) as Record<string, unknown>;
    } catch {
      current = {};
    }
    data = { ...current, ...parsed.data };
  }
  const dataJson = JSON.stringify(data);
  if (dataJson.length > 100_000) return { ok: false, message: "Block data is too large." };

  const page = await loadPage(block.pageId);
  try {
    await createRevision({ entityType: "Page", entityId: block.pageId, snapshot: page, authorId: user.id, note: `Edit ${block.type} block` });
    const saved = await prisma.contentBlock.update({ where: { id: blockId }, data: { dataJson } });
    await snapshotAndRevalidate(user.id, block.pageId, "UPDATE", JSON.stringify(block), JSON.stringify(saved));
  } catch (error) {
    return friendlyDbError(error);
  }
  return { ok: true, message: "Block saved." };
}

export async function moveBlock(blockId: string, direction: "up" | "down", _prev: ActionState): Promise<ActionState> {
  void _prev; // required by useActionState signature
  const user = await actionUser("content.update");
  if (!user) return DENIED;
  if (!ID_RE.test(blockId)) return NOT_FOUND;
  const block = await prisma.contentBlock.findUnique({ where: { id: blockId } });
  if (!block) return NOT_FOUND;
  const siblings = await prisma.contentBlock.findMany({ where: { pageId: block.pageId }, orderBy: { order: "asc" } });
  const index = siblings.findIndex((b) => b.id === blockId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= siblings.length) return { ok: true };
  const reordered = [...siblings];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  try {
    await prisma.$transaction(reordered.map((b, i) => prisma.contentBlock.update({ where: { id: b.id }, data: { order: i } })));
    await snapshotAndRevalidate(user.id, block.pageId, "UPDATE", JSON.stringify({ order: siblings.map((b) => b.id) }), JSON.stringify({ order: reordered.map((b) => b.id) }));
  } catch (error) {
    return friendlyDbError(error);
  }
  return { ok: true, message: "Block moved." };
}

export async function toggleBlock(blockId: string, _prev: ActionState): Promise<ActionState> {
  void _prev; // required by useActionState signature
  const user = await actionUser("content.update");
  if (!user) return DENIED;
  if (!ID_RE.test(blockId)) return NOT_FOUND;
  const block = await prisma.contentBlock.findUnique({ where: { id: blockId } });
  if (!block) return NOT_FOUND;
  try {
    const saved = await prisma.contentBlock.update({ where: { id: blockId }, data: { isVisible: !block.isVisible } });
    await snapshotAndRevalidate(user.id, block.pageId, "UPDATE", JSON.stringify({ isVisible: block.isVisible }), JSON.stringify({ isVisible: saved.isVisible }));
  } catch (error) {
    return friendlyDbError(error);
  }
  return { ok: true, message: block.isVisible ? "Block hidden." : "Block visible." };
}

export async function deleteBlock(blockId: string, _prev: ActionState): Promise<ActionState> {
  void _prev; // required by useActionState signature
  const user = await actionUser("content.update");
  if (!user) return DENIED;
  if (!ID_RE.test(blockId)) return NOT_FOUND;
  const block = await prisma.contentBlock.findUnique({ where: { id: blockId } });
  if (!block) return NOT_FOUND;
  const page = await loadPage(block.pageId);
  try {
    await createRevision({ entityType: "Page", entityId: block.pageId, snapshot: page, authorId: user.id, note: `Delete ${block.type} block` });
    await prisma.contentBlock.delete({ where: { id: blockId } });
    const rest = await prisma.contentBlock.findMany({ where: { pageId: block.pageId }, orderBy: { order: "asc" } });
    await prisma.$transaction(rest.map((b, i) => prisma.contentBlock.update({ where: { id: b.id }, data: { order: i } })));
    await snapshotAndRevalidate(user.id, block.pageId, "DELETE", JSON.stringify(block), null);
  } catch (error) {
    return friendlyDbError(error);
  }
  return { ok: true, message: "Block deleted." };
}
