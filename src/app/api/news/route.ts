import { getNews } from "@/lib/content";
import { NewsCategorySchema } from "@/lib/enum-schemas";
import { listResponse, queryParam } from "../_lib/respond";

/** GET /api/news?category=&take= — published, PUBLIC-visibility articles. */
export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = NewsCategorySchema.safeParse(queryParam(url, "category")?.toUpperCase());
  const takeRaw = Number(queryParam(url, "take") ?? "");
  const take = Number.isInteger(takeRaw) && takeRaw > 0 ? Math.min(takeRaw, 50) : undefined;
  const data = await getNews({ category: category.success ? category.data : undefined, take });
  return listResponse(data, { category: category.success ? category.data : null });
}
