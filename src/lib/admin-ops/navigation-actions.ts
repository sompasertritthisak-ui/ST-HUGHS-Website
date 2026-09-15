"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordAudit, createRevision } from "@/lib/audit";
import { NavMenuSchema } from "@/lib/enums";
import { guard, requestIp } from "./guard";
import { HrefSchema, bool, str, zodErrors } from "./form";
import { fail, succeed, type ActionState } from "./types";

const Id = z.string().min(1).max(64);

const NavItemSchema = z.object({
  id: z.string().max(64).optional(),
  menu: NavMenuSchema,
  label: z.string().trim().min(1, "Label is required.").max(80),
  href: HrefSchema,
  description: z.string().trim().max(200).optional().default(""),
  isVisible: z.boolean(),
  parentId: z.string().max(64).optional().default(""),
});

function revalidate() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/navigation");
}

export async function saveNavigationItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("navigation.update");
  if (!g.ok) return fail(g.message);
  const parsed = NavItemSchema.safeParse({
    id: str(formData, "id") || undefined,
    menu: str(formData, "menu"),
    label: str(formData, "label"),
    href: str(formData, "href"),
    description: str(formData, "description"),
    isVisible: bool(formData, "isVisible"),
    parentId: str(formData, "parentId"),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", zodErrors(parsed.error));
  const { id, menu, label, href, description, isVisible } = parsed.data;
  let parentId: string | null = parsed.data.parentId || null;

  // Nesting: one level, HEADER only, parent must be a root item in the same menu.
  if (parentId) {
    if (menu !== "HEADER") return fail("Only header items can be nested.", { parentId: "Nesting is only available in the header menu." });
    if (id && parentId === id) return fail("An item cannot be its own parent.", { parentId: "Choose a different parent." });
    const parent = await prisma.navigationItem.findUnique({ where: { id: parentId }, select: { menu: true, parentId: true } });
    if (!parent || parent.menu !== "HEADER" || parent.parentId) return fail("Invalid parent.", { parentId: "Parent must be a top-level header item." });
    if (id) {
      const childCount = await prisma.navigationItem.count({ where: { parentId: id } });
      if (childCount > 0) return fail("This item has children and cannot be nested itself.", { parentId: "Move its children first." });
    }
  } else {
    parentId = null;
  }

  const ip = await requestIp();
  if (id) {
    const before = await prisma.navigationItem.findUnique({ where: { id } });
    if (!before) return fail("Navigation item not found.");
    await createRevision({ entityType: "NavigationItem", entityId: id, snapshot: before, authorId: g.user.id });
    const after = await prisma.navigationItem.update({ where: { id }, data: { label, href, description: description || null, isVisible, parentId } });
    await recordAudit({ actorId: g.user.id, action: "UPDATE", entityType: "NavigationItem", entityId: id, beforeJson: JSON.stringify(before), afterJson: JSON.stringify(after), ip });
    revalidate();
    return succeed("Navigation item saved.");
  }
  const last = await prisma.navigationItem.findFirst({ where: { menu, parentId }, orderBy: { order: "desc" }, select: { order: true } });
  const created = await prisma.navigationItem.create({ data: { menu, label, href, description: description || null, isVisible, parentId, order: (last?.order ?? -1) + 1 } });
  await recordAudit({ actorId: g.user.id, action: "CREATE", entityType: "NavigationItem", entityId: created.id, afterJson: JSON.stringify(created), ip });
  revalidate();
  return succeed("Navigation item added.");
}

/** Plain form action (no state): swap `order` with the neighbour in the same menu + parent. */
export async function moveNavigationItem(formData: FormData): Promise<void> {
  const g = await guard("navigation.update");
  if (!g.ok) return;
  const parsed = z.object({ id: Id, direction: z.enum(["up", "down"]) }).safeParse({ id: str(formData, "id"), direction: str(formData, "direction") });
  if (!parsed.success) return;
  const item = await prisma.navigationItem.findUnique({ where: { id: parsed.data.id } });
  if (!item) return;
  const siblings = await prisma.navigationItem.findMany({ where: { menu: item.menu, parentId: item.parentId }, orderBy: [{ order: "asc" }, { label: "asc" }] });
  const idx = siblings.findIndex((s) => s.id === item.id);
  const swapIdx = parsed.data.direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return;
  // Normalise to dense 0..n-1 ordering, then swap.
  const ordered = siblings.map((s, i) => ({ id: s.id, order: i }));
  [ordered[idx].order, ordered[swapIdx].order] = [ordered[swapIdx].order, ordered[idx].order];
  await prisma.$transaction(ordered.map((o) => prisma.navigationItem.update({ where: { id: o.id }, data: { order: o.order } })));
  await recordAudit({
    actorId: g.user.id,
    action: "UPDATE",
    entityType: "NavigationItem",
    entityId: item.id,
    beforeJson: JSON.stringify({ order: idx }),
    afterJson: JSON.stringify({ order: swapIdx, direction: parsed.data.direction }),
    ip: await requestIp(),
  });
  revalidate();
}

export async function toggleNavigationVisibility(formData: FormData): Promise<void> {
  const g = await guard("navigation.update");
  if (!g.ok) return;
  const id = Id.safeParse(str(formData, "id"));
  if (!id.success) return;
  const item = await prisma.navigationItem.findUnique({ where: { id: id.data }, select: { isVisible: true } });
  if (!item) return;
  await prisma.navigationItem.update({ where: { id: id.data }, data: { isVisible: !item.isVisible } });
  await recordAudit({ actorId: g.user.id, action: "UPDATE", entityType: "NavigationItem", entityId: id.data, beforeJson: JSON.stringify({ isVisible: item.isVisible }), afterJson: JSON.stringify({ isVisible: !item.isVisible }), ip: await requestIp() });
  revalidate();
}

export async function deleteNavigationItem(formData: FormData): Promise<void> {
  const g = await guard("navigation.update");
  if (!g.ok) return;
  const id = Id.safeParse(str(formData, "id"));
  if (!id.success) return;
  const before = await prisma.navigationItem.findUnique({ where: { id: id.data }, include: { children: { select: { id: true } } } });
  if (!before) return;
  // Children are promoted to the root of the menu rather than deleted.
  await prisma.$transaction([
    prisma.navigationItem.updateMany({ where: { parentId: id.data }, data: { parentId: null } }),
    prisma.navigationItem.delete({ where: { id: id.data } }),
  ]);
  await recordAudit({ actorId: g.user.id, action: "DELETE", entityType: "NavigationItem", entityId: id.data, beforeJson: JSON.stringify(before), ip: await requestIp() });
  revalidate();
}
