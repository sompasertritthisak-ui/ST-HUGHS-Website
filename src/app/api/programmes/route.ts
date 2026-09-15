import { getProgrammes } from "@/lib/content";
import { ProgrammeTypeSchema } from "@/lib/enums";
import { listResponse, queryParam } from "../_lib/respond";

/** GET /api/programmes?type=&featured=1 — published programmes only. */
export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = ProgrammeTypeSchema.safeParse(queryParam(url, "type"));
  const featured = queryParam(url, "featured") === "1";
  const data = await getProgrammes({ type: type.success ? type.data : undefined, featured });
  return listResponse(data);
}
