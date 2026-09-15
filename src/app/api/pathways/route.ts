import { getPathways } from "@/lib/content";
import { listResponse, queryParam } from "../_lib/respond";

/** GET /api/pathways?programme=&destination=&subject=&featured=1 — published pathways with steps. */
export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters = {
    programmeSlug: queryParam(url, "programme"),
    destinationSlug: queryParam(url, "destination"),
    subjectArea: queryParam(url, "subject"),
    featured: queryParam(url, "featured") === "1",
  };
  const data = await getPathways(filters);
  return listResponse(data, { filters: { programme: filters.programmeSlug ?? null, destination: filters.destinationSlug ?? null, subject: filters.subjectArea ?? null } });
}
