import { getEvents } from "@/lib/content";
import { listResponse, queryParam } from "../_lib/respond";

/** GET /api/events?upcoming=1 — published events, soonest first. */
export const revalidate = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const data = await getEvents({ upcoming: queryParam(url, "upcoming") === "1" });
  return listResponse(data);
}
