import { getPathwayBySlug } from "@/lib/content";
import { itemResponse } from "../../_lib/respond";

/** GET /api/pathways/[slug] — one published pathway with programme, destination, university and steps. */
export const revalidate = 300;

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return itemResponse(await getPathwayBySlug(slug));
}
