import { getProgrammeBySlug } from "@/lib/content";
import { itemResponse } from "../../_lib/respond";

/** GET /api/programmes/[slug] — one published programme with modules, pathways, FAQs and consented stories. */
export const revalidate = 300;

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return itemResponse(await getProgrammeBySlug(slug));
}
