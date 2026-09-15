import "server-only";

/**
 * Outbound notifications for new leads. Both functions are best-effort: they
 * never throw and never block the response for long (5s timeout).
 *
 * Environment:
 *   EMAIL_API_KEY            transactional email provider key (Resend-compatible API)
 *   EMAIL_FROM               sender, default "admissions@sthughs.edu.la"
 *   ADMISSIONS_NOTIFY_EMAIL  comma-separated recipients for new-lead alerts
 *   EMAIL_API_URL            optional override, default https://api.resend.com/emails
 *   CRM_WEBHOOK_URL          optional CRM/automation webhook (HubSpot, Zoho, Make, n8n…)
 *   CRM_API_KEY              optional bearer token sent with the webhook
 *   APPLICATION_URL          used to build the admin deep link in the email
 */

export type EnquiryNotification = {
  id: string;
  type: string; // ENQUIRY | CONSULTATION | BROCHURE | VISIT
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  audience: string;
  currentQualification?: string | null;
  programme?: { slug: string; title: string } | null;
  destination?: { slug: string; country: string } | null;
  pathwaySlug?: string | null;
  message?: string | null;
  source?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  consentMarketing: boolean;
  consultation?: { preferredDate: string; preferredTime: string; mode: string } | null;
  createdAt: string; // ISO
};

const TIMEOUT_MS = 5000;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function recipients() {
  return (process.env.ADMISSIONS_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function adminLink(id: string) {
  const base = process.env.APPLICATION_URL ?? "http://localhost:3000";
  return new URL(`/admin/enquiries/${id}`, base).toString();
}

function renderEmail(e: EnquiryNotification) {
  const rows: [string, string | null | undefined][] = [
    ["Type", e.type],
    ["Name", e.name],
    ["Email", e.email],
    ["Phone", e.phone],
    ["Country", e.country],
    ["Audience", e.audience],
    ["Qualification", e.currentQualification],
    ["Programme", e.programme?.title],
    ["Destination", e.destination?.country],
    ["Pathway", e.pathwaySlug],
    ["Preferred date", e.consultation ? `${e.consultation.preferredDate} ${e.consultation.preferredTime} (${e.consultation.mode})` : null],
    ["Message", e.message],
    ["Source", [e.source, e.utmSource, e.utmMedium, e.utmCampaign].filter(Boolean).join(" / ") || null],
    ["Referrer", e.referrer],
    ["Marketing consent", e.consentMarketing ? "Yes" : "No"],
  ];
  const text = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const html =
    `<h2>New ${escapeHtml(e.type.toLowerCase())} — ${escapeHtml(e.name)}</h2><table>` +
    rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><th align="left">${escapeHtml(k)}</th><td>${escapeHtml(String(v))}</td></tr>`)
      .join("") +
    `</table><p><a href="${adminLink(e.id)}">Open in the admissions pipeline</a></p>`;
  return { text: `${text}\n\n${adminLink(e.id)}`, html };
}

/**
 * Email the admissions team about a new lead.
 *
 * Payload (Resend-compatible `POST /emails`):
 * {
 *   "from": EMAIL_FROM,
 *   "to": ["admissions@…"],
 *   "reply_to": "<lead email>",
 *   "subject": "New consultation request — <name>",
 *   "text": "...", "html": "..."
 * }
 * Headers: Authorization: Bearer EMAIL_API_KEY, Content-Type: application/json.
 *
 * When EMAIL_API_KEY or ADMISSIONS_NOTIFY_EMAIL is missing, a structured log
 * line is emitted instead so the lead is still visible in server logs.
 */
export async function notifyNewEnquiry(enquiry: EnquiryNotification): Promise<{ sent: boolean; reason?: string }> {
  const to = recipients();
  const apiKey = process.env.EMAIL_API_KEY;
  const subject = `New ${enquiry.type === "CONSULTATION" ? "consultation request" : enquiry.type.toLowerCase()} — ${enquiry.name}`;

  if (!apiKey || to.length === 0) {
    console.info(
      JSON.stringify({
        event: "enquiry.notify.skipped",
        reason: "email not configured",
        id: enquiry.id,
        type: enquiry.type,
        audience: enquiry.audience,
        programme: enquiry.programme?.slug ?? null,
        destination: enquiry.destination?.slug ?? null,
        consultation: enquiry.consultation ?? null,
        at: enquiry.createdAt,
      }),
    );
    return { sent: false, reason: "not-configured" };
  }

  try {
    const { text, html } = renderEmail(enquiry);
    const res = await fetch(process.env.EMAIL_API_URL ?? "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "admissions@sthughs.edu.la",
        to,
        reply_to: enquiry.email,
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(JSON.stringify({ event: "enquiry.notify.failed", id: enquiry.id, status: res.status }));
      return { sent: false, reason: `http-${res.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error(JSON.stringify({ event: "enquiry.notify.failed", id: enquiry.id, error: String(error) }));
    return { sent: false, reason: "error" };
  }
}

/**
 * Forward the lead to an external CRM / automation webhook.
 *
 * Payload (JSON):
 * {
 *   "event": "enquiry.created",
 *   "sentAt": "<ISO timestamp>",
 *   "enquiry": { ...EnquiryNotification }
 * }
 * Headers: Content-Type: application/json, Authorization: Bearer CRM_API_KEY (when set),
 *          X-SHV-Event: enquiry.created.
 * No-op when CRM_WEBHOOK_URL is unset.
 */
export async function forwardToCrm(enquiry: EnquiryNotification): Promise<{ sent: boolean; reason?: string }> {
  const url = process.env.CRM_WEBHOOK_URL;
  if (!url) return { sent: false, reason: "not-configured" };
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", "X-SHV-Event": "enquiry.created" };
    if (process.env.CRM_API_KEY) headers.Authorization = `Bearer ${process.env.CRM_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ event: "enquiry.created", sentAt: new Date().toISOString(), enquiry }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(JSON.stringify({ event: "enquiry.crm.failed", id: enquiry.id, status: res.status }));
      return { sent: false, reason: `http-${res.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error(JSON.stringify({ event: "enquiry.crm.failed", id: enquiry.id, error: String(error) }));
    return { sent: false, reason: "error" };
  }
}
