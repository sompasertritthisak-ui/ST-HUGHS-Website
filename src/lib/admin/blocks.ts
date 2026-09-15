import { FAQ_CATEGORIES, FAQ_CATEGORY_LABELS, PARTNER_TYPES, PARTNER_TYPE_LABELS, PROGRAMME_TYPES, PROGRAMME_TYPE_LABELS, type BlockType } from "@/lib/enums";
import { f } from "./fields";
import type { FieldDef } from "./types";

/**
 * Per-block-type form definitions for the page builder. Each block's
 * `dataJson` is the object produced by these fields (plus anything set via the
 * validated JSON editor). The public renderer parses `dataJson` defensively,
 * so extra keys are harmless and missing keys fall back to empty states.
 */

const withAll = (opts: readonly string[]) => ["ALL", ...opts] as const;
const allLabels = (labels: Record<string, string>) => ({ ALL: "All", ...labels });

const cta: FieldDef[] = [
  f.text("primaryLabel", "Primary button label"),
  f.url("primaryHref", "Primary button link"),
  f.text("secondaryLabel", "Secondary button label"),
  f.url("secondaryHref", "Secondary button link"),
];

const heading: FieldDef[] = [f.text("eyebrow", "Eyebrow", { maxLength: 60 }), f.text("title", "Title", { maxLength: 160 })];

export const BLOCK_FIELDS: Record<BlockType, FieldDef[]> = {
  HERO: [...heading, f.textarea("lede", "Supporting text", { fullWidth: true }), ...cta, f.media("mediaId", "Background image")],
  RICH_TEXT: [...heading, f.markdown("body", "Body", { required: true, fullWidth: true })],
  IMAGE: [f.media("mediaId", "Image", ["IMAGE"]), f.text("slot", "Photography slot name", { hint: "Shown on the plate until an approved image is chosen." }), f.text("caption", "Caption"), f.select("aspect", "Aspect", ["16/9", "4/3", "3/2", "1/1", "21/9", "3/4"], { "16/9": "16:9", "4/3": "4:3", "3/2": "3:2", "1/1": "Square", "21/9": "21:9", "3/4": "Portrait 3:4" })],
  VIDEO: [f.url("url", "Video URL", { required: true, hint: "YouTube or Vimeo page URL." }), f.text("title", "Title"), f.media("posterMediaId", "Poster image"), f.text("caption", "Caption")],
  STATISTICS: [...heading, f.textarea("lede", "Intro", { fullWidth: true }), f.stringArray("keys", "Outcome metric keys", { hint: "One key per line, matching Outcome metrics. Leave empty to show all published metrics." })],
  PROGRAMME_GRID: [...heading, f.textarea("lede", "Intro", { fullWidth: true }), f.select("type", "Programme type", withAll(PROGRAMME_TYPES), allLabels(PROGRAMME_TYPE_LABELS)), f.boolean("featuredOnly", "Featured only")],
  UNIVERSITY_GRID: [...heading, f.textarea("lede", "Intro", { fullWidth: true }), f.boolean("featuredOnly", "Featured only")],
  PATHWAY_TIMELINE: [...heading, f.text("pathwaySlug", "Pathway slug", { required: true }), f.select("orientation", "Orientation", ["horizontal", "vertical"], { horizontal: "Horizontal", vertical: "Vertical" })],
  MAP: [...heading, f.textarea("lede", "Intro", { fullWidth: true })],
  TESTIMONIAL: [f.text("storySlug", "Student story slug", { hint: "Use a published story with consent granted, or fill the fields below." }), f.textarea("quote", "Quote", { fullWidth: true }), f.text("name", "Name"), f.text("role", "Role / context")],
  STUDENT_STORY: [...heading, f.boolean("featuredOnly", "Featured only"), f.number("take", "Maximum items", { integer: true, min: 1, max: 12 })],
  FAQ: [...heading, f.select("category", "Category", withAll(FAQ_CATEGORIES), allLabels(FAQ_CATEGORY_LABELS)), f.text("programmeSlug", "Programme slug", { hint: "Optional: only FAQs linked to this programme." })],
  CTA: [...heading, f.textarea("body", "Body", { fullWidth: true }), ...cta],
  GALLERY: [...heading, f.stringArray("mediaIds", "Media IDs", { hint: "One media ID per line (copy from the media library)." })],
  COMPARISON_TABLE: [...heading, f.stringArray("columns", "Column headings", { hint: "One heading per line. Rows are edited in the JSON editor as [{\"label\": \"…\", \"values\": [\"…\"]}]." })],
  LOGO_WALL: [...heading, f.boolean("featuredOnly", "Featured only"), f.select("partnerType", "Partner type", withAll(PARTNER_TYPES), allLabels(PARTNER_TYPE_LABELS))],
  QUOTE: [f.textarea("text", "Quote", { required: true, fullWidth: true }), f.text("attribution", "Attribution")],
  MEDIA: [f.media("mediaId", "Media", ["IMAGE", "VIDEO"], { required: true }), f.text("caption", "Caption"), f.select("aspect", "Aspect", ["16/9", "4/3", "3/2", "1/1", "21/9", "3/4"], { "16/9": "16:9", "4/3": "4:3", "3/2": "3:2", "1/1": "Square", "21/9": "21:9", "3/4": "Portrait 3:4" })],
};

export function blockFields(type: string): FieldDef[] {
  return BLOCK_FIELDS[type as BlockType] ?? [];
}
