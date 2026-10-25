import "server-only";
import { prisma } from "@/lib/prisma";
import { CAMPUS_TIME_ZONE } from "@/lib/utils";
import { AUDIENCE_LABELS, CONSULTATION_MODE_LABELS, ENQUIRY_STATUS_LABELS, type Audience, type ConsultationMode, type EnquiryStatus } from "@/lib/enums";

/** The sheet shows the same readable labels as the CMS (the Apps Script colours rows by these labels). */
export const ENQUIRY_TYPE_LABELS: Record<string, string> = { ENQUIRY: "Enquiry", CONSULTATION: "Consultation", BROCHURE: "Brochure request", VISIT: "Campus tour" };

/**
 * Google Sheets backup of enquiries.
 *
 * Every enquiry is upserted (by Enquiry ID) into a Google Sheet through a small Apps Script web app attached to the
 * sheet (docs/google-sheets-backup.gs). The site sends rows; the script writes them. Nothing here can fail an
 * enquiry: it never throws, times out after 10 s, and is a no-op until both env vars are set:
 *   SHEETS_WEBHOOK_URL     the Apps Script "Web app" URL (…/exec)
 *   SHEETS_WEBHOOK_SECRET  a long random phrase, typed identically into the Apps Script
 */

export const SHEET_COLUMNS = [
  { key: "id", header: "Enquiry ID" },
  { key: "receivedAt", header: "Received (Laos time)" },
  { key: "type", header: "Type" },
  { key: "status", header: "Status" },
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "country", header: "Country" },
  { key: "audience", header: "I am a" },
  { key: "qualification", header: "Current qualification" },
  { key: "programme", header: "Programme" },
  { key: "destination", header: "Destination" },
  { key: "message", header: "Message" },
  { key: "consultationDate", header: "Consultation date" },
  { key: "consultationTime", header: "Consultation time" },
  { key: "consultationMode", header: "Consultation mode" },
  { key: "assignedTo", header: "Assigned to" },
  { key: "followUp", header: "Follow-up" },
  { key: "source", header: "Source page" },
  { key: "utmSource", header: "UTM source" },
  { key: "utmMedium", header: "UTM medium" },
  { key: "utmCampaign", header: "UTM campaign" },
  { key: "consentMarketing", header: "Marketing consent" },
  { key: "updatedAt", header: "Last updated (Laos time)" },
] as const;

export type SheetRow = Record<(typeof SHEET_COLUMNS)[number]["key"], string>;

/** Text from a public form must never become a spreadsheet formula (=, +, -, @ …): prefix it so Sheets keeps it as text. */
export function sheetSafe(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value).replace(/\r\n?/g, "\n").slice(0, 5000);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

const stamp = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-GB", { timeZone: CAMPUS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d) : "";

const dateOnly = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-CA", { timeZone: CAMPUS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d) : "";

type EnquiryForSheet = Awaited<ReturnType<typeof loadEnquiries>>[number];

export function toSheetRow(e: EnquiryForSheet): SheetRow {
  return {
    id: sheetSafe(e.id),
    receivedAt: stamp(e.createdAt),
    type: sheetSafe(ENQUIRY_TYPE_LABELS[e.type] ?? e.type),
    status: sheetSafe(ENQUIRY_STATUS_LABELS[e.status as EnquiryStatus] ?? e.status),
    name: sheetSafe(e.name),
    email: sheetSafe(e.email),
    phone: sheetSafe(e.phone),
    country: sheetSafe(e.country),
    audience: sheetSafe(AUDIENCE_LABELS[e.audience as Audience] ?? e.audience),
    qualification: sheetSafe(e.currentQualification),
    programme: sheetSafe(e.programme?.shortTitle ?? e.programme?.title),
    destination: sheetSafe(e.destination?.country),
    message: sheetSafe(e.message),
    consultationDate: dateOnly(e.consultation?.preferredDate),
    consultationTime: sheetSafe(e.consultation?.preferredTime),
    consultationMode: sheetSafe(e.consultation?.mode ? (CONSULTATION_MODE_LABELS[e.consultation.mode as ConsultationMode] ?? e.consultation.mode) : null),
    assignedTo: sheetSafe(e.assignedTo?.name),
    followUp: stamp(e.followUpAt),
    source: sheetSafe(e.source),
    utmSource: sheetSafe(e.utmSource),
    utmMedium: sheetSafe(e.utmMedium),
    utmCampaign: sheetSafe(e.utmCampaign),
    consentMarketing: e.consentMarketing ? "Yes" : "No",
    updatedAt: stamp(e.updatedAt),
  };
}

function loadEnquiries(where: { id?: { in: string[] } } = {}, skip = 0, take = 200) {
  return prisma.enquiry.findMany({
    where,
    include: {
      programme: { select: { title: true, shortTitle: true } },
      destination: { select: { country: true } },
      consultation: { select: { preferredDate: true, preferredTime: true, mode: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
    skip,
    take,
  });
}

export const sheetsConfigured = () => Boolean(process.env.SHEETS_WEBHOOK_URL && process.env.SHEETS_WEBHOOK_SECRET);

async function post(rows: SheetRow[]): Promise<{ ok: boolean; reason?: string }> {
  const url = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) return { ok: false, reason: "not-configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, columns: SHEET_COLUMNS, rows }),
      redirect: "follow", // Apps Script answers through a redirect to googleusercontent.com
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    let body: { ok?: boolean; error?: string } = {};
    try {
      body = JSON.parse(text);
    } catch {
      /* non-JSON: usually the script is not deployed with access "Anyone" */
    }
    if (!res.ok || !body.ok) return { ok: false, reason: body.error ?? `http-${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.name : "error" };
  }
}

/** Upsert the given enquiries into the sheet. Never throws. */
export async function syncEnquiriesToSheet(ids: string[]): Promise<{ ok: boolean; count: number; reason?: string }> {
  if (!sheetsConfigured()) return { ok: false, count: 0, reason: "not-configured" };
  if (!ids.length) return { ok: true, count: 0 };
  try {
    const rows = (await loadEnquiries({ id: { in: ids } })).map(toSheetRow);
    const r = await post(rows);
    if (!r.ok) console.error("[sheets] sync failed:", r.reason);
    return { ...r, count: r.ok ? rows.length : 0 };
  } catch (err) {
    console.error("[sheets] sync error:", err instanceof Error ? err.message : err);
    return { ok: false, count: 0, reason: "error" };
  }
}

/** Upsert every enquiry, in batches (CMS → Settings → "Sync all enquiries"). Never throws. */
export async function syncAllEnquiriesToSheet(): Promise<{ ok: boolean; count: number; reason?: string }> {
  if (!sheetsConfigured()) return { ok: false, count: 0, reason: "not-configured" };
  let count = 0;
  try {
    for (let skip = 0; ; skip += 200) {
      const batch = await loadEnquiries({}, skip, 200);
      if (!batch.length) break;
      const r = await post(batch.map(toSheetRow));
      if (!r.ok) return { ok: false, count, reason: r.reason };
      count += batch.length;
      if (batch.length < 200) break;
    }
    return { ok: true, count };
  } catch (err) {
    console.error("[sheets] full sync error:", err instanceof Error ? err.message : err);
    return { ok: false, count, reason: "error" };
  }
}

/** Queue a sync for after the response (form submissions, CMS edits). Safe to call anywhere on the server. */
export function queueSheetSync(ids: string[]) {
  if (!sheetsConfigured() || !ids.length) return;
  const run = () => syncEnquiriesToSheet(ids).catch(() => undefined);
  import("next/server")
    .then(({ after }) => {
      try {
        after(run);
      } catch {
        void run(); // outside a request scope (scripts, tests)
      }
    })
    .catch(() => void run());
}
