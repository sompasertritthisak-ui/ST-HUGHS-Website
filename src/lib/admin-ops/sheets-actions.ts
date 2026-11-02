"use server";

import { recordAudit } from "@/lib/audit";
import { syncAllEnquiriesToSheet } from "@/lib/sheets";
import { guard, requestIp } from "./guard";
import { fail, succeed, type ActionState } from "./types";

const REASONS: Record<string, string | undefined> = {
  "not-configured": "The Google Sheets backup is not set up yet (SHEETS_WEBHOOK_URL and SHEETS_WEBHOOK_SECRET).",
  unauthorised:
    "The sheet rejected the secret: SECRET_SHA256 in the Apps Script must be the fingerprint shown above. If you changed it after deploying, publish it: Deploy → Manage deployments → ✎ → Version: New version → Deploy. (An older copy of the script that still has a SECRET line needs replacing with the current one.)",
  "secret-not-set":
    "The Apps Script still has the placeholder fingerprint. Paste the fingerprint shown above into SECRET_SHA256, Save, then Deploy → Manage deployments → ✎ → Version: New version → Deploy.",
  "secret-not-fingerprint":
    "SECRET_SHA256 in the Apps Script must be the 64-character fingerprint shown above, not the phrase itself.",
  // Google answers 401/403 before the script runs: the URL is not the public web app (a /dev test URL, or a deployment
  // that is not "Anyone"). 404: the deployment was deleted or the URL is mistyped.
  "http-401":
    "Google refused the request before it reached the script, so SHEETS_WEBHOOK_URL is not the public web app. In the Apps Script: Deploy → Manage deployments → copy the Web app URL ending in /exec (not a Test deployment URL ending in /dev), and check Who has access is \"Anyone\". Put that URL in SHEETS_WEBHOOK_URL in the Cloudflare Worker settings.",
  "http-404": "Google has no web app at SHEETS_WEBHOOK_URL. Copy the Web app URL (ends in /exec) again from Deploy → Manage deployments.",
  TimeoutError: "Google did not answer in time. Try again in a minute.",
};
REASONS["http-403"] = REASONS["http-401"];

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
