"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordAudit, createRevision } from "@/lib/audit";
import { guard, requestIp } from "./guard";
import { ContactSettingsSchema, InstitutionSettingsSchema, MessagingSettingsSchema } from "./settings";
import { bool, list, str, zodErrors } from "./form";
import { fail, succeed, type ActionState } from "./types";

async function persist(key: string, value: unknown, actorId: string): Promise<ActionState> {
  const before = await prisma.siteSetting.findUnique({ where: { key } });
  if (before) {
    let snapshot: unknown = before.valueJson;
    try {
      snapshot = JSON.parse(before.valueJson);
    } catch {
      /* keep raw string */
    }
    await createRevision({ entityType: "SiteSetting", entityId: key, snapshot, authorId: actorId });
  }
  const valueJson = JSON.stringify(value);
  await prisma.siteSetting.upsert({ where: { key }, update: { valueJson }, create: { key, valueJson } });
  await recordAudit({
    actorId,
    action: before ? "UPDATE" : "CREATE",
    entityType: "SiteSetting",
    entityId: key,
    beforeJson: before?.valueJson ?? null,
    afterJson: valueJson,
    ip: await requestIp(),
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return succeed("Settings saved. The public site will reflect the change on next load.");
}

function numOrUndefined(v: string): number | undefined {
  if (v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export async function saveContactSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("settings.update");
  if (!g.ok) return fail(g.message);
  const mapLat = numOrUndefined(str(formData, "mapLat"));
  const mapLng = numOrUndefined(str(formData, "mapLng"));
  const errors: Record<string, string> = {};
  if (Number.isNaN(mapLat)) errors.mapLat = "Enter a decimal latitude, e.g. 17.9757";
  if (Number.isNaN(mapLng)) errors.mapLng = "Enter a decimal longitude, e.g. 102.6331";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);
  const parsed = ContactSettingsSchema.safeParse({
    institutionName: str(formData, "institutionName"),
    shortName: str(formData, "shortName"),
    addressLines: list(formData, "addressLines"),
    phones: list(formData, "phones"),
    emails: list(formData, "emails"),
    whatsapp: str(formData, "whatsapp"),
    officeHours: list(formData, "officeHours"),
    mapEmbedUrl: str(formData, "mapEmbedUrl"),
    mapLat,
    mapLng,
    social: {
      facebook: str(formData, "social.facebook") || undefined,
      linkedin: str(formData, "social.linkedin") || undefined,
      youtube: str(formData, "social.youtube") || undefined,
      instagram: str(formData, "social.instagram") || undefined,
      tiktok: str(formData, "social.tiktok") || undefined,
    },
    admissionsContact: str(formData, "admissionsContact"),
    pressContact: str(formData, "pressContact"),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", zodErrors(parsed.error));
  // Extra hygiene the shared schema does not enforce.
  const extra: Record<string, string> = {};
  parsed.data.emails.forEach((e, i) => {
    if (!z.email().safeParse(e).success) extra[`emails.${i}`] = `"${e}" is not a valid email.`;
  });
  for (const [k, v] of Object.entries(parsed.data.social)) {
    if (v && !/^https:\/\//i.test(v)) extra[`social.${k}`] = "Must be an https:// URL";
  }
  if (parsed.data.mapEmbedUrl && !/^https:\/\//i.test(parsed.data.mapEmbedUrl)) extra.mapEmbedUrl = "Must be an https:// URL";
  if (Object.keys(extra).length) return fail("Please fix the highlighted fields.", extra);
  return persist("contact", parsed.data, g.user.id);
}

export async function saveMessagingSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("settings.update");
  if (!g.ok) return fail(g.message);
  const parsed = MessagingSettingsSchema.safeParse({
    heroLine1: str(formData, "heroLine1"),
    heroLine2: str(formData, "heroLine2"),
    heroSupport: str(formData, "heroSupport"),
    tagline: str(formData, "tagline"),
    finalCtaTitle: str(formData, "finalCtaTitle"),
    finalCtaBody: str(formData, "finalCtaBody"),
    guidanceDisclaimer: str(formData, "guidanceDisclaimer"),
    announcement: str(formData, "announcement"),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", zodErrors(parsed.error));
  if (!parsed.data.guidanceDisclaimer.trim()) return fail("The guidance disclaimer is required.", { guidanceDisclaimer: "Guidance tools must always carry this line." });
  return persist("messaging", parsed.data, g.user.id);
}

export async function saveInstitutionSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("settings.update");
  if (!g.ok) return fail(g.message);
  const established = numOrUndefined(str(formData, "established"));
  if (Number.isNaN(established)) return fail("Please fix the highlighted fields.", { established: "Enter a four-digit year." });
  const parsed = InstitutionSettingsSchema.safeParse({
    established,
    authorisation: str(formData, "authorisation"),
    authorisationSource: str(formData, "authorisationSource"),
    ncukStudyCentre: bool(formData, "ncukStudyCentre"),
    ncukSince: str(formData, "ncukSince"),
    sisterInstitution: str(formData, "sisterInstitution"),
    partnersNote: str(formData, "partnersNote"),
    vision: str(formData, "vision"),
    mission: str(formData, "mission"),
    governanceNote: str(formData, "governanceNote"),
    visaOfficialLink: str(formData, "visaOfficialLink"),
    accommodationNote: str(formData, "accommodationNote"),
    costsNote: str(formData, "costsNote"),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", zodErrors(parsed.error));
  return persist("institution", parsed.data, g.user.id);
}
