"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CONSENT_STATUSES, USAGE_STATUSES } from "@/lib/enums";
import { createRevision, recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { actionUser, requestIp } from "./session";
import { DENIED, NOT_FOUND, friendlyDbError } from "./workflow";
import type { ActionState } from "./types";

const ID_RE = /^[a-z0-9_-]{5,64}$/i;

const MediaUpdateSchema = z
  .object({
    alt: z.string().trim().max(300),
    caption: z.string().trim().max(500).transform((v) => v || null),
    credit: z.string().trim().max(200).transform((v) => v || null),
    focalX: z.coerce.number().min(0).max(1),
    focalY: z.coerce.number().min(0).max(1),
    tags: z.string().max(2000).transform((v) =>
      v
        .split(/\r?\n|,/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 50),
    ),
    usageStatus: z.enum(USAGE_STATUSES),
    consentStatus: z.enum(CONSENT_STATUSES),
  })
  .refine((v) => v.usageStatus !== "APPROVED" || v.alt.length > 0, { path: ["alt"], error: "Alt text is required before media can be approved for public use." });

export async function updateMedia(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await actionUser("media.update");
  if (!user) return DENIED;
  if (!ID_RE.test(id)) return NOT_FOUND;
  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) return NOT_FOUND;
  const raw = Object.fromEntries(["alt", "caption", "credit", "focalX", "focalY", "tags", "usageStatus", "consentStatus"].map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = MediaUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "_form")] ??= issue.message;
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const { tags, ...rest } = parsed.data;
  try {
    await createRevision({ entityType: "Media", entityId: id, snapshot: existing, authorId: user.id, note: "Before update" });
    const saved = await prisma.media.update({ where: { id }, data: { ...rest, tagsJson: JSON.stringify(tags) } });
    await recordAudit({ actorId: user.id, action: "UPDATE", entityType: "Media", entityId: id, beforeJson: JSON.stringify(existing), afterJson: JSON.stringify(saved), ip: await requestIp() });
  } catch (error) {
    return friendlyDbError(error);
  }
  revalidatePath("/admin/media");
  revalidatePath(`/admin/media/${id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Media saved." };
}

const REFERENCE_COUNTS = {
  programmesHero: true,
  destinationsHero: true,
  universityLogos: true,
  partnerLogos: true,
  storyPhotos: true,
  facultyPhotos: true,
  facilityPhotos: true,
  newsHero: true,
  eventHero: true,
  documents: true,
  pageOgImages: true,
} as const;

export async function deleteMedia(id: string, _prev: ActionState): Promise<ActionState> {
  void _prev; // required by useActionState signature
  const user = await actionUser("media.delete");
  if (!user) return DENIED;
  if (!ID_RE.test(id)) return NOT_FOUND;
  const existing = await prisma.media.findUnique({ where: { id }, include: { _count: { select: REFERENCE_COUNTS } } });
  if (!existing) return NOT_FOUND;
  const references = Object.values(existing._count).reduce((a, b) => a + b, 0);
  if (references > 0) return { ok: false, message: `This file is used by ${references} item${references === 1 ? "" : "s"}. Remove those references first.` };
  const { _count, ...record } = existing;
  void _count;
  try {
    await createRevision({ entityType: "Media", entityId: id, snapshot: record, authorId: user.id, note: "Before delete" });
    await prisma.media.delete({ where: { id } });
    if (record.url.startsWith("/uploads/")) {
      const file = path.join(process.cwd(), "public", "uploads", path.basename(record.url));
      await unlink(file).catch(() => undefined);
    }
    await recordAudit({ actorId: user.id, action: "DELETE", entityType: "Media", entityId: id, beforeJson: JSON.stringify(record), ip: await requestIp() });
  } catch (error) {
    return friendlyDbError(error);
  }
  revalidatePath("/admin/media");
  redirect("/admin/media?deleted=1");
}
