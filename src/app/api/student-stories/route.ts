import { getStudentStories } from "@/lib/content";
import { listResponse, queryParam } from "../_lib/respond";

/** GET /api/student-stories?featured=1&take= — published stories with GRANTED consent only. */
export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const takeRaw = Number(queryParam(url, "take") ?? "");
  const take = Number.isInteger(takeRaw) && takeRaw > 0 ? Math.min(takeRaw, 50) : undefined;
  const data = await getStudentStories({ featured: queryParam(url, "featured") === "1", take });
  return listResponse(data);
}
