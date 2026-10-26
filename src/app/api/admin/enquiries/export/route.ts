import { NextResponse, type NextRequest } from "next/server";
import { recordAudit } from "@/lib/audit";
import { AUDIENCE_LABELS, CONSULTATION_MODE_LABELS, ENQUIRY_STATUS_LABELS, type Audience, type ConsultationMode, type EnquiryStatus } from "@/lib/enums";
import { guard, requestIp } from "@/lib/admin-ops/guard";
import { exportEnquiries, filtersToParams, parseEnquiryFilters } from "@/lib/admin-ops/enquiries";
import { toCsv } from "@/lib/admin-ops/csv";
import { toXlsx, type XlsxCell, type XlsxColumn } from "@/lib/admin-ops/xlsx";
import { ENQUIRY_TYPE_LABELS } from "@/lib/sheets";
import { CAMPUS_TIME_ZONE } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/enquiries/export?…filters&includeNotes=1&format=xlsx|csv
 * Permission: enquiries.export. Accepts exactly the same filters as /admin/enquiries.
 * xlsx (default): readable headings and labels, Laos-time dates, St Hugh's styling — opens in columns everywhere.
 * csv: machine column names and ISO UTC times, for imports into other systems.
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
  const format = sp.get("format") === "csv" ? "csv" : "xlsx";

  const rows = await exportEnquiries(filters, includeNotes);

  // Laos time in the file name, e.g. shv-enquiries-2026-10-27-00-32-42
  const stamp = new Intl.DateTimeFormat("sv-SE", { timeZone: CAMPUS_TIME_ZONE, dateStyle: "short", timeStyle: "medium" }).format(new Date()).replace(/[: ]/g, "-");
  const audit = async () =>
    recordAudit({
      actorId: g.user.id,
      action: "UPDATE",
      entityType: "Enquiry",
      entityId: null,
      afterJson: JSON.stringify({ note: "export", format, count: rows.length, includeNotes, filters: filtersToParams(filters) }),
      ip: await requestIp(),
    });
  const notesOf = (e: (typeof rows)[number]) =>
    ("notes" in e && Array.isArray(e.notes) ? e.notes : []).map((n) => `[${n.createdAt.toISOString()}] ${n.body}`).join("\n---\n");

  if (format === "xlsx") {
    const columns: (XlsxColumn & { value: (e: (typeof rows)[number]) => XlsxCell })[] = [
      { header: "Received (Laos time)", kind: "datetime", width: 18, value: (e) => e.createdAt },
      { header: "Type", width: 16, value: (e) => ENQUIRY_TYPE_LABELS[e.type] ?? e.type },
      { header: "Status", width: 20, value: (e) => ENQUIRY_STATUS_LABELS[e.status as EnquiryStatus] ?? e.status },
      { header: "Name", width: 22, value: (e) => e.name },
      { header: "Email", width: 30, value: (e) => e.email },
      { header: "Phone", width: 18, value: (e) => e.phone },
      { header: "Country", width: 14, value: (e) => e.country },
      { header: "I am a", width: 12, value: (e) => AUDIENCE_LABELS[e.audience as Audience] ?? e.audience },
      { header: "Current qualification", kind: "wrap", width: 24, value: (e) => e.currentQualification },
      { header: "Programme", width: 30, value: (e) => e.programme?.title },
      { header: "Destination", width: 16, value: (e) => e.destination?.country },
      { header: "Message", kind: "wrap", width: 50, value: (e) => e.message },
      { header: "Assigned to", width: 18, value: (e) => e.assignedTo?.name },
      { header: "Follow-up (Laos time)", kind: "datetime", width: 18, value: (e) => e.followUpAt },
      { header: "Marketing consent", width: 12, value: (e) => (e.consentMarketing ? "Yes" : "No") },
      { header: "Consultation date", kind: "date", width: 14, value: (e) => e.consultation?.preferredDate },
      { header: "Consultation time", width: 14, value: (e) => e.consultation?.preferredTime },
      { header: "Consultation mode", width: 16, value: (e) => (e.consultation ? CONSULTATION_MODE_LABELS[e.consultation.mode as ConsultationMode] ?? e.consultation.mode : null) },
      { header: "Consultation confirmed (Laos time)", kind: "datetime", width: 18, value: (e) => e.consultation?.confirmedAt },
      { header: "Source page", width: 20, value: (e) => e.source },
      { header: "Referrer", width: 24, value: (e) => e.referrer },
      { header: "UTM source", width: 14, value: (e) => e.utmSource },
      { header: "UTM medium", width: 14, value: (e) => e.utmMedium },
      { header: "UTM campaign", width: 16, value: (e) => e.utmCampaign },
      { header: "Campaign", width: 18, value: (e) => e.campaign?.name },
      { header: "Last updated (Laos time)", kind: "datetime", width: 18, value: (e) => e.updatedAt },
      { header: "Enquiry ID", width: 28, value: (e) => e.id },
      ...(includeNotes ? [{ header: "Notes", kind: "wrap" as const, width: 50, value: notesOf }] : []),
    ];
    const file = toXlsx("Enquiries", columns, rows.map((e) => columns.map((c) => c.value(e))), CAMPUS_TIME_ZONE);
    await audit();
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="shv-enquiries-${stamp}.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

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
    ...(includeNotes ? [notesOf(e)] : []),
  ]);

  await audit();
  return new NextResponse(toCsv(headers, data), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shv-enquiries-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
