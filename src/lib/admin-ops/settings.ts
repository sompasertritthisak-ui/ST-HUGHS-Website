import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ContactSettingsSchema, MessagingSettingsSchema } from "@/lib/content";
import { parseJson } from "@/lib/utils";
import { OptionalHttpsUrl } from "./form";

export const SETTINGS_TABS = ["contact", "messaging", "institution", "integrations"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];
export const SETTINGS_TAB_LABELS: Record<SettingsTab, string> = {
  contact: "Contact",
  messaging: "Messaging",
  institution: "Institution",
  integrations: "Integrations",
};

/** Matches the `institution` seed keys plus the guidance fields used on international/admissions pages. */
export const InstitutionSettingsSchema = z.object({
  established: z.number().int().min(1900).max(2100).optional(),
  authorisation: z.string().trim().max(2000).default(""),
  authorisationSource: z.string().trim().max(200).default(""),
  ncukStudyCentre: z.boolean().default(false),
  ncukSince: z.string().trim().max(500).default(""),
  sisterInstitution: z.string().trim().max(300).default(""),
  vision: z.string().trim().max(2000).default(""),
  mission: z.string().trim().max(2000).default(""),
  governanceNote: z.string().trim().max(2000).default(""),
  visaOfficialLink: OptionalHttpsUrl,
  accommodationNote: z.string().trim().max(2000).default(""),
  costsNote: z.string().trim().max(2000).default(""),
});
export type InstitutionSettings = z.infer<typeof InstitutionSettingsSchema>;

export { ContactSettingsSchema, MessagingSettingsSchema };

/** Raw admin read: current value parsed against its schema (defaults fill any gaps). */
export async function readSetting<T>(key: string, schema: z.ZodType<T>): Promise<{ value: T; updatedAt: Date | null; raw: string | null }> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  const fallback = schema.safeParse({});
  const value = parseJson(row?.valueJson, schema, fallback.success ? fallback.data : ({} as T));
  return { value, updatedAt: row?.updatedAt ?? null, raw: row?.valueJson ?? null };
}

export const INTEGRATION_ENV_VARS = [
  { key: "EMAIL_API_KEY", label: "Transactional email", note: "Enquiry confirmations and staff notifications." },
  { key: "CRM_WEBHOOK_URL", label: "CRM webhook", note: "POST {event, enquiry} to HubSpot / Salesforce / Zoho — see docs/CRM_INTEGRATION.md." },
  { key: "WHATSAPP_NUMBER", label: "WhatsApp business number", note: "Used for the WhatsApp contact button." },
  { key: "ANALYTICS_ID", label: "External analytics ID", note: "Third-party analytics property, if used alongside first-party events." },
  { key: "MAP_API_KEY", label: "Map API key", note: "Interactive campus map on the contact page." },
] as const;

/** Only whether a variable is set — never the value. */
export function integrationStatus() {
  return INTEGRATION_ENV_VARS.map((v) => ({ ...v, configured: Boolean(process.env[v.key]?.trim()) }));
}
