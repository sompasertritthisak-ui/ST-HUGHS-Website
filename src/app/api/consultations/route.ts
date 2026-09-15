import { handleLeadSubmission } from "../_lib/lead";

/**
 * POST /api/consultations — book a free consultation.
 * Body: ConsultationSchema (JSON or form). Creates an Enquiry(type=CONSULTATION) + Consultation.
 * 201 { ok, id } · 422 { ok:false, errors } · 429 Retry-After.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleLeadSubmission(req, "CONSULTATION");
}
