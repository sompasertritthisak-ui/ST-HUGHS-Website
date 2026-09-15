import { getDocuments } from "@/lib/content";
import { DocumentCategorySchema } from "@/lib/enums";
import { listResponse, queryParam } from "../_lib/respond";

/** GET /api/documents?category= — published, PUBLIC-visibility documents with their media. */
export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = DocumentCategorySchema.safeParse(queryParam(url, "category")?.toUpperCase());
  const data = await getDocuments({ category: category.success ? category.data : undefined });
  return listResponse(data, { category: category.success ? category.data : null });
}
