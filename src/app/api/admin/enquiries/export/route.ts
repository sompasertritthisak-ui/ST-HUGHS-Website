import { NextResponse, type NextRequest } from "next/server";
import { recordAudit } from "@/lib/audit";
import { AUDIENCE_LABELS, CONSULTATION_MODE_LABELS, ENQUIRY_STATUS_LABELS, type Audience, type ConsultationMode, type EnquiryStatus } from "@/lib/enums";
import { guard, requestIp } from "@/lib/admin-ops/guard";
import { exportEnquiries, filtersToParams, parseEnquiryFilters } from "@/lib/admin-ops/enquiries";
import { toCsv } from "@/lib/admin-ops/csv";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/enquiries/export?…filters&includeNotes=1
 * Permission: enquiries.export. Accepts exactly the same filters as /admin/enquiries.
 * Note bodies are private and are only included when includeNotes=1 is explicit.
 * Audit: the AuditAction enum has no EXPORT value, so exports are logged as
 * action "UPDATE" on entityType "Enquiry" with afterJson.note = "export".
 */
export async function GET(req: NextRequest) {
  const g = await guard("enquiries.export");
  if (!g.ok) return NextResponse.json({ error: g.message }, { status: g.status });

  const sp = req.nextUrl.searchParams;
  const params: Record<string, string> = {};
  sp.forEach((v, k) => (params[k] = v));
  const filters = parseEnquiryFilters(params);
  const includeNotes = sp.get("includeNotes") === "1";

  const rows = await exportEnquiries(filters, includeNotes);

  const headers = [
    "id",
    "created_at",
    "updated_at",
    "type",
    "status",
    "status_label",
    "name",
    "email",
    "phone",
    "country",
    "audience",
    "audience_label",
    "current_qualification",
    "programme",
    "destination",
    "message",
    "assigned_to",
    "follow_up_at",
    "consent_marketing",
    "source_path",
    "referrer",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "campaign",
    "consultation_preferred_date",
    "consultation_preferred_time",
    "consultation_mode",
    "consultation_confirmed_at",
    ...(includeNotes ? ["notes"] : []),
  ];

  const data = rows.map((e) => [
    e.id,
    e.createdAt,
    e.updatedAt,
    e.type,
    e.status,
    ENQUIRY_STATUS_LABELS[e.status as EnquiryStatus] ?? e.status,
    e.name,
    e.email,
    e.phone,
    e.country,
    e.audience,
    AUDIENCE_LABELS[e.audience as Audience] ?? e.audience,
    e.currentQualification,
    e.programme?.title,
    e.destination?.country,
    e.message,
    e.assignedTo?.name,
    e.followUpAt,
    e.consentMarketing ? "yes" : "no",
    e.source,
    e.referrer,
    e.utmSource,
    e.utmMedium,
    e.utmCampaign,
    e.campaign?.name,
    e.consultation?.preferredDate,
    e.consultation?.preferredTime,
    e.consultation ? CONSULTATION_MODE_LABELS[e.consultation.mode as ConsultationMode] ?? e.consultation.mode : null,
    e.consultation?.confirmedAt,
    ...(includeNotes ? [("notes" in e && Array.isArray(e.notes) ? e.notes : []).map((n) => `[${n.createdAt.toISOString()}] ${n.body}`).join("\n---\n")] : []),
  ]);

  await recordAudit({
    actorId: g.user.id,
    action: "UPDATE",
    entityType: "Enquiry",
    entityId: null,
    afterJson: JSON.stringify({ note: "export", format: "csv", count: rows.length, includeNotes, filters: filtersToParams(filters) }),
    ip: await requestIp(),
  });

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return new NextResponse(toCsv(headers, data), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shv-enquiries-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
