import { z } from "zod";
import { AudienceSchema, ConsultationModeSchema } from "@/lib/enum-schemas";

/**
 * Lead schemas shared by the public forms (client) and the write APIs (server).
 * Keep this file free of server-only imports.
 *
 * Both JSON and `FormData` submissions are accepted, so scalar fields tolerate
 * string inputs ("" → undefined, "on" → true) before validation.
 */

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const optionalSlug = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid reference")
    .optional(),
);

/** Loose E.164-ish: optional +, digits, spaces, dashes, parentheses. */
const PHONE_RE = /^\+?[0-9][0-9\s().-]{5,24}$/;

const looseBoolean = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["true", "on", "1", "yes"].includes(v.trim().toLowerCase());
  return false;
}, z.boolean());

/** Public enquiry kinds that can be created through /api/enquiries. */
export const PublicEnquiryTypeSchema = z.enum(["ENQUIRY", "BROCHURE", "VISIT"]);
export type PublicEnquiryType = z.infer<typeof PublicEnquiryTypeSchema>;

export const LeadBaseSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(120, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  phone: z.preprocess(
    blankToUndefined,
    z.string().trim().regex(PHONE_RE, "Please enter a valid phone number, including the country code").max(25).optional(),
  ),
  country: optionalText(80),
  audience: z.preprocess((v) => (v === undefined || v === "" ? "STUDENT" : v), AudienceSchema),
  currentQualification: optionalText(200),
  programmeSlug: optionalSlug,
  destinationSlug: optionalSlug,
  message: z.preprocess(blankToUndefined, z.string().trim().max(2000, "Please keep your message under 2000 characters").optional()),
  consentMarketing: looseBoolean.default(false),

  // Attribution (captured by the client, never required)
  source: optionalText(120),
  referrer: optionalText(500),
  utmSource: optionalText(120),
  utmMedium: optionalText(120),
  utmCampaign: optionalText(120),
  sessionId: optionalText(64),

  /** Honeypot. Real users never see this field; bots fill it. Must stay empty. */
  website: z.preprocess((v) => (v === undefined || v === null ? "" : v), z.string().max(0, "Invalid submission")),
});

export const EnquirySchema = LeadBaseSchema.extend({
  type: z.preprocess((v) => (v === undefined || v === "" ? "ENQUIRY" : typeof v === "string" ? v.toUpperCase() : v), PublicEnquiryTypeSchema),
});
export type EnquiryInput = z.infer<typeof EnquirySchema>;

// ── Consultation ─────────────────────────────────────────────────────────────

export const CONSULTATION_TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"] as const;
export const ConsultationTimeSlotSchema = z.enum(CONSULTATION_TIME_SLOTS);
export type ConsultationTimeSlot = z.infer<typeof ConsultationTimeSlotSchema>;

/** Campus time zone used to decide what "today" means for a booking. */
export const CAMPUS_TIME_ZONE = "Asia/Vientiane";

/** `YYYY-MM-DD` for the given instant in the campus time zone. */
export function todayIsoDate(now: Date = new Date(), timeZone: string = CAMPUS_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const PreferredDateSchema = z
  .string()
  .trim()
  .regex(ISO_DATE_RE, "Please choose a date")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Please choose a valid date")
  .refine((v) => v >= todayIsoDate(), "Please choose today or a later date");

export const ConsultationSchema = LeadBaseSchema.extend({
  preferredDate: PreferredDateSchema,
  preferredTime: z.preprocess(blankToUndefined, ConsultationTimeSlotSchema),
  mode: z.preprocess((v) => (v === undefined || v === "" ? "IN_PERSON" : v), ConsultationModeSchema),
  pathwaySlug: optionalSlug,
});
export type ConsultationInput = z.infer<typeof ConsultationSchema>;

/** Field-keyed error map used by the API envelope and the forms. */
export type FieldErrors = Record<string, string[]>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** True when a bot filled the hidden field. Checked before validation so bots get a quiet 200. */
export function isHoneypotTripped(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const v = (raw as Record<string, unknown>).website;
  return typeof v === "string" && v.trim().length > 0;
}
