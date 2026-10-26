"use client";

import { useActionState, useState } from "react";
import { syncAllEnquiriesAction } from "@/lib/admin-ops/sheets-actions";
import { initialActionState } from "@/lib/admin-ops/types";
import { FormStatus, SubmitButton } from "./form-status";

export function SheetsSyncForm({ configured, canExport, fingerprint }: { configured: boolean; canExport: boolean; fingerprint: string | null }) {
  const [state, action] = useActionState(syncAllEnquiriesAction, initialActionState);
  const [copied, setCopied] = useState(false);
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-fg-muted">
        New enquiries and consultation bookings are copied to the sheet automatically, and a row updates when its status,
        assignee or follow-up date changes here. Use this button once to copy existing enquiries, or any time to refresh
        the whole sheet. Rows are matched by Enquiry ID, so nothing is duplicated.
      </p>
      {fingerprint ? (
        <div className="rounded-md border border-line bg-bg-hover px-3 py-2.5">
          <p className="text-xs font-semibold text-fg">Secret fingerprint (SHA-256)</p>
          <p className="mt-0.5 text-xs text-fg-muted">
            Paste this into <code className="font-mono">SECRET_SHA256</code> in the Apps Script. The script keeps only this fingerprint; the
            secret itself stays in Railway.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 break-all font-mono text-xs text-fg">{fingerprint}</code>
            <button
              type="button"
              className="rounded border border-line px-2 py-1 text-xs font-medium text-fg hover:bg-bg"
              onClick={() => navigator.clipboard.writeText(fingerprint).then(() => setCopied(true), () => setCopied(false))}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}
      <div>
        <SubmitButton pendingLabel="Copying enquiries…" variant="secondary">
          Sync all enquiries now
        </SubmitButton>
      </div>
      {!configured ? <p className="text-xs text-fg-subtle">Not set up yet — the button will explain what is missing.</p> : null}
      {!canExport ? <p className="text-xs text-fg-subtle">You need the export-enquiries permission to run a full sync.</p> : null}
      <FormStatus state={state} />
    </form>
  );
}
