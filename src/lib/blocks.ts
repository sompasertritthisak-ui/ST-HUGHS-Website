import { z } from "zod";
import type { BlockType } from "./enums";
import { parseJson } from "./utils";

/**
 * Zod schemas for `ContentBlock.dataJson`, one per block type.
 * Blocks are content-driven: anything that lists catalogue data (programmes,
 * universities, pathways, stories, FAQs, partners, metrics) stores only a
 * filter and the renderer fetches PUBLISHED rows through the content layer.
 */

const optionalText = z.string().optional().default("");
const aspect = z.enum(["16/9", "4/3", "3/4", "1/1", "21/9", "3/2"]).optional().default("16/9");

export const HeroBlockSchema = z.object({ eyebrow: optionalText, title: z.string(), lede: optionalText });
export const RichTextBlockSchema = z.object({ body: z.string() });
export const ImageBlockSchema = z.object({ mediaId: z.string().optional(), slot: optionalText, caption: optionalText, aspect });
export const VideoBlockSchema = z.object({ url: z.string(), title: optionalText, caption: optionalText });
export const StatisticsBlockSchema = z.object({ title: optionalText, lede: optionalText, keys: z.array(z.string()).optional().default([]) });
export const ProgrammeGridBlockSchema = z.object({ title: optionalText, lede: optionalText, featuredOnly: z.boolean().optional().default(false), type: z.string().optional() });
export const UniversityGridBlockSchema = z.object({ title: optionalText, lede: optionalText, featuredOnly: z.boolean().optional().default(false) });
export const PathwayTimelineBlockSchema = z.object({ title: optionalText, pathwaySlug: z.string(), orientation: z.enum(["vertical", "horizontal"]).optional().default("horizontal") });
export const MapBlockSchema = z.object({ title: optionalText, lede: optionalText });
export const TestimonialBlockSchema = z.object({ storySlug: z.string().optional(), quote: optionalText, name: optionalText, role: optionalText });
export const StudentStoryBlockSchema = z.object({ title: optionalText, featuredOnly: z.boolean().optional().default(false), take: z.number().int().positive().optional().default(3) });
export const FaqBlockSchema = z.object({ title: optionalText, category: z.string().optional(), programmeSlug: z.string().optional() });
export const CtaBlockSchema = z.object({
  title: z.string(),
  body: optionalText,
  primaryLabel: z.string(),
  primaryHref: z.string(),
  secondaryLabel: z.string().optional(),
  secondaryHref: z.string().optional(),
});
export const GalleryBlockSchema = z.object({ title: optionalText, mediaIds: z.array(z.string()).optional().default([]), slots: z.array(z.string()).optional().default([]) });
export const ComparisonTableBlockSchema = z.object({
  title: optionalText,
  columns: z.array(z.string()).min(1),
  rows: z.array(z.object({ label: z.string(), values: z.array(z.string()) })),
  footnote: optionalText,
});
export const LogoWallBlockSchema = z.object({ title: optionalText, featuredOnly: z.boolean().optional().default(false) });
export const QuoteBlockSchema = z.object({ text: z.string(), attribution: optionalText });
export const MediaBlockSchema = z.object({ mediaId: z.string(), caption: optionalText, aspect });

export const BLOCK_SCHEMAS = {
  HERO: HeroBlockSchema,
  RICH_TEXT: RichTextBlockSchema,
  IMAGE: ImageBlockSchema,
  VIDEO: VideoBlockSchema,
  STATISTICS: StatisticsBlockSchema,
  PROGRAMME_GRID: ProgrammeGridBlockSchema,
  UNIVERSITY_GRID: UniversityGridBlockSchema,
  PATHWAY_TIMELINE: PathwayTimelineBlockSchema,
  MAP: MapBlockSchema,
  TESTIMONIAL: TestimonialBlockSchema,
  STUDENT_STORY: StudentStoryBlockSchema,
  FAQ: FaqBlockSchema,
  CTA: CtaBlockSchema,
  GALLERY: GalleryBlockSchema,
  COMPARISON_TABLE: ComparisonTableBlockSchema,
  LOGO_WALL: LogoWallBlockSchema,
  QUOTE: QuoteBlockSchema,
  MEDIA: MediaBlockSchema,
} as const satisfies Record<BlockType, z.ZodType>;

export type BlockData = { [K in BlockType]: z.infer<(typeof BLOCK_SCHEMAS)[K]> };

export type ParsedBlock = { [K in BlockType]: { id: string; type: K; data: BlockData[K] } }[BlockType];

/** Parse a stored block. Returns null when the type is unknown or the data is invalid. */
export function parseBlock(block: { id: string; type: string; dataJson: string }): ParsedBlock | null {
  if (!(block.type in BLOCK_SCHEMAS)) return null;
  const type = block.type as BlockType;
  const schema = BLOCK_SCHEMAS[type];
  let raw: unknown;
  try {
    raw = JSON.parse(block.dataJson || "{}");
  } catch {
    return null;
  }
  const result = schema.safeParse(raw);
  if (!result.success) return null;
  return { id: block.id, type, data: result.data } as ParsedBlock;
}

/** Convenience for admin forms: safe parse with schema defaults. */
export function parseBlockData<K extends BlockType>(type: K, dataJson: string | null | undefined): BlockData[K] | null {
  const schema = BLOCK_SCHEMAS[type] as unknown as z.ZodType<BlockData[K]>;
  const fallback = schema.safeParse({});
  return parseJson<BlockData[K] | null>(dataJson, schema, fallback.success ? fallback.data : null);
}
