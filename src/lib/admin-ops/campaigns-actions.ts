"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { recordAudit, createRevision } from "@/lib/audit";
import { guard, requestIp } from "./guard";
import { CampaignInputSchema } from "./campaigns";
import { bool, dateOrNull, str, zodErrors } from "./form";
import { fail, succeed, type ActionState } from "./types";

function readCampaign(formData: FormData) {
  const startsAt = dateOrNull(formData, "startsAt");
  const endsAt = dateOrNull(formData, "endsAt");
  const errors: Record<string, string> = {};
  if (startsAt === undefined) errors.startsAt = "Enter a valid date.";
  if (endsAt === undefined) errors.endsAt = "Enter a valid date.";
  if (Object.keys(errors).length) return { errors };
  const parsed = CampaignInputSchema.safeParse({
    name: str(formData, "name"),
    utmSource: str(formData, "utmSource"),
    utmMedium: str(formData, "utmMedium"),
    utmCampaign: str(formData, "utmCampaign"),
    landingPage: str(formData, "landingPage"),
    startsAt: startsAt ?? null,
    endsAt: endsAt ?? null,
    isActive: bool(formData, "isActive"),
  });
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  return { data: parsed.data };
}

function toRow(d: NonNullable<ReturnType<typeof readCampaign>["data"]>) {
  return {
    name: d.name,
    utmSource: d.utmSource || null,
    utmMedium: d.utmMedium || null,
    utmCampaign: d.utmCampaign,
    landingPage: d.landingPage || null,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    isActive: d.isActive,
  };
}

export async function createCampaign(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("campaigns.manage");
  if (!g.ok) return fail(g.message);
  const r = readCampaign(formData);
  if (!r.data) return fail("Please fix the highlighted fields.", r.errors);
  const clash = await prisma.campaign.findUnique({ where: { utmCampaign: r.data.utmCampaign }, select: { id: true } });
  if (clash) return fail("That utm_campaign is already in use.", { utmCampaign: "Must be unique across campaigns." });
  const row = await prisma.campaign.create({ data: toRow(r.data) });
  await recordAudit({ actorId: g.user.id, action: "CREATE", entityType: "Campaign", entityId: row.id, afterJson: JSON.stringify(row), ip: await requestIp() });
  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${row.id}`);
}

export async function updateCampaign(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("campaigns.manage");
  if (!g.ok) return fail(g.message);
  const id = z.string().min(1).max(64).safeParse(str(formData, "id"));
  if (!id.success) return fail("Campaign not found.");
  const r = readCampaign(formData);
  if (!r.data) return fail("Please fix the highlighted fields.", r.errors);
  const before = await prisma.campaign.findUnique({ where: { id: id.data } });
  if (!before) return fail("Campaign not found.");
  const clash = await prisma.campaign.findFirst({ where: { utmCampaign: r.data.utmCampaign, NOT: { id: id.data } }, select: { id: true } });
  if (clash) return fail("That utm_campaign is already in use.", { utmCampaign: "Must be unique across campaigns." });
  await createRevision({ entityType: "Campaign", entityId: id.data, snapshot: before, authorId: g.user.id });
  const after = await prisma.campaign.update({ where: { id: id.data }, data: toRow(r.data) });
  await recordAudit({ actorId: g.user.id, action: "UPDATE", entityType: "Campaign", entityId: id.data, beforeJson: JSON.stringify(before), afterJson: JSON.stringify(after), ip: await requestIp() });
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id.data}`);
  return succeed("Campaign saved.");
}

export async function deleteCampaign(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("campaigns.manage");
  if (!g.ok) return fail(g.message);
  const id = z.string().min(1).max(64).safeParse(str(formData, "id"));
  if (!id.success) return fail("Campaign not found.");
  const before = await prisma.campaign.findUnique({ where: { id: id.data }, include: { _count: { select: { enquiries: true } } } });
  if (!before) return fail("Campaign not found.");
  if (before._count.enquiries > 0) {
    return fail(`This campaign is linked to ${before._count.enquiries} enquir${before._count.enquiries === 1 ? "y" : "ies"}. Deactivate it instead so attribution is preserved.`);
  }
  await prisma.campaign.delete({ where: { id: id.data } });
  await recordAudit({ actorId: g.user.id, action: "DELETE", entityType: "Campaign", entityId: id.data, beforeJson: JSON.stringify(before), ip: await requestIp() });
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}
