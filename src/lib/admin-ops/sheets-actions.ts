"use server";

import { recordAudit } from "@/lib/audit";
import { syncAllEnquiriesToSheet } from "@/lib/sheets";
import { guard, requestIp } from "./guard";
import { fail, succeed, type ActionState } from "./types";

const REASONS: Record<string, string> = {
  "not-configured": "The Google Sheets backup is not set up yet (SHEETS_WEBHOOK_URL and SHEETS_WEBHOOK_SECRET).",
  unauthorised: "The sheet rejected the secret: SHEETS_WEBHOOK_SECRET must match SECRET in the Apps Script.",
  TimeoutError: "Google did not answer in time. Try again in a minute.",
};

/** CMS → Settings → Integrations: copy every enquiry into the backup sheet (upsert by Enquiry ID). */
export async function syncAllEnquiriesAction(_prev: ActionState): Promise<ActionState> {
  void _prev;
  const g = await guard("enquiries.export");
  if (!g.ok) return fail(g.message);
  const r = await syncAllEnquiriesToSheet();
  await recordAudit({ actorId: g.user.id, action: "UPDATE", entityType: "Enquiry", entityId: null, afterJson: JSON.stringify({ note: "export", format: "google-sheets", ok: r.ok, count: r.count }), ip: await requestIp() });
  if (!r.ok) return fail(REASONS[r.reason ?? ""] ?? `The sheet could not be updated (${r.reason ?? "unknown error"}).${r.count ? ` ${r.count} enquiries were copied before it stopped.` : ""}`);
  return succeed(`Done — ${r.count} ${r.count === 1 ? "enquiry" : "enquiries"} copied to the Google Sheet.`);
}
