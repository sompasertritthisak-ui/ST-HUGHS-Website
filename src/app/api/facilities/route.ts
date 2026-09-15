import { getFacilities } from "@/lib/content";
import { listResponse } from "../_lib/respond";

/** GET /api/facilities — published campus facilities. */
export const revalidate = 300;

export async function GET() {
  return listResponse(await getFacilities());
}
