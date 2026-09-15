import { getDestinations } from "@/lib/content";
import { listResponse } from "../_lib/respond";

/** GET /api/destinations — published destinations with their published universities and pathways. */
export const revalidate = 300;

export async function GET() {
  return listResponse(await getDestinations());
}
