import { getUniversities } from "@/lib/content";
import { listResponse, queryParam } from "../_lib/respond";

/** GET /api/universities?featured=1 — published universities with destination and published pathways. */
export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const data = await getUniversities({ featured: queryParam(url, "featured") === "1" });
  return listResponse(data);
}
