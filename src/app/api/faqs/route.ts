import { getFaqs } from "@/lib/content";
import { FaqCategorySchema } from "@/lib/enum-schemas";
import { listResponse, queryParam } from "../_lib/respond";

/** GET /api/faqs?category=&programme= — published FAQs grouped by category order. */
export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = FaqCategorySchema.safeParse(queryParam(url, "category")?.toUpperCase());
  const data = await getFaqs({ category: category.success ? category.data : undefined, programmeSlug: queryParam(url, "programme") });
  return listResponse(data, { category: category.success ? category.data : null });
}
