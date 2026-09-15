import { handleLeadSubmission } from "../_lib/lead";

/**
 * POST /api/enquiries — public lead capture (students, parents, partners, employers).
 * Body: EnquirySchema (JSON or form). 201 { ok, id } · 422 { ok:false, errors } · 429 Retry-After.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleLeadSubmission(req, "ENQUIRY");
}
