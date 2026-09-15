import { CONSENT_STATUSES, VERIFICATION_LABELS, VERIFICATION_STATUSES } from "@/lib/enums";
import type { DelegateName, FieldDef, FieldGroup } from "./types";

/** Small factories so entity definitions read as a table rather than JSON. */
type Opts = Partial<Omit<FieldDef, "name" | "label" | "type">>;

const make = (type: FieldDef["type"]) => (name: string, label: string, opts: Opts = {}): FieldDef => ({ name, label, type, ...opts });

export const f = {
  text: make("text"),
  slug: make("slug"),
  url: make("url"),
  textarea: make("textarea"),
  markdown: make("markdown"),
  json: make("json"),
  number: make("number"),
  boolean: make("boolean"),
  date: make("date"),
  stringArray: make("string-array"),
  select: (name: string, label: string, options: readonly string[], optionLabels?: Record<string, string>, opts: Opts = {}): FieldDef => ({
    name,
    label,
    type: "select",
    options,
    optionLabels,
    ...opts,
  }),
  relation: (name: string, label: string, delegate: DelegateName, labelField: string, opts: Opts = {}): FieldDef => ({
    name,
    label,
    type: "relation",
    relation: { delegate, labelField },
    ...opts,
  }),
  media: (name: string, label: string, mediaKinds: readonly string[] = ["IMAGE"], opts: Opts = {}): FieldDef => ({
    name,
    label,
    type: "media",
    mediaKinds,
    ...opts,
  }),
};

export const CONSENT_LABELS: Record<string, string> = {
  NOT_REQUIRED: "Not required",
  PENDING: "Consent pending",
  GRANTED: "Consent granted",
  WITHDRAWN: "Consent withdrawn",
};

export const STORY_CONSENT = CONSENT_STATUSES.filter((c) => c !== "NOT_REQUIRED");

/** Governance fields shared by time-sensitive entities. */
export function governance(opts: { owner?: boolean; effectiveDate?: boolean; reviewDate?: boolean; verification?: boolean; sourceNote?: boolean }): FieldDef[] {
  const g: FieldGroup = "governance";
  const out: FieldDef[] = [];
  if (opts.verification) out.push(f.select("verificationStatus", "Verification status", VERIFICATION_STATUSES, VERIFICATION_LABELS, { group: g, hint: "Only VERIFIED items should be presented as fact on the public site." }));
  if (opts.sourceNote) out.push(f.textarea("sourceNote", "Source note", { group: g, hint: "Where this information was confirmed (URL, document, person, date)." }));
  if (opts.owner) out.push(f.relation("ownerId", "Owner", "user", "name", { group: g, hint: "Staff member responsible for keeping this accurate." }));
  if (opts.effectiveDate) out.push(f.date("effectiveDate", "Effective date", { group: g }));
  if (opts.reviewDate) out.push(f.date("reviewDate", "Review date", { group: g, hint: "The dashboard flags items whose review date has passed." }));
  return out;
}

export function seo(): FieldDef[] {
  return [
    f.text("seoTitle", "SEO title", { group: "seo", maxLength: 70 }),
    f.textarea("seoDescription", "Meta description", { group: "seo", maxLength: 200 }),
  ];
}

export const featuredAndOrder: FieldDef[] = [
  f.boolean("featured", "Featured", { group: "details" }),
  f.number("sortOrder", "Sort order", { group: "details", integer: true, nonNull: true, min: 0, max: 9999 }),
];
