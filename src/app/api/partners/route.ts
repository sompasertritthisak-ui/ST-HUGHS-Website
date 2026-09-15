import { getPartners } from "@/lib/content";
import { listResponse } from "../_lib/respond";

/** GET /api/partners — published partners (verificationStatus is included so clients can badge unverified ones). */
export const revalidate = 300;

export async function GET() {
  return listResponse(await getPartners());
}
