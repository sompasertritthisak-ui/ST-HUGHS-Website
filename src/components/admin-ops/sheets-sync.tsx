"use client";

import { useActionState } from "react";
import { syncAllEnquiriesAction } from "@/lib/admin-ops/sheets-actions";
import { initialActionState } from "@/lib/admin-ops/types";
import { FormStatus, SubmitButton } from "./form-status";

export function SheetsSyncForm({ configured, canExport }: { configured: boolean; canExport: boolean }) {
  const [state, action] = useActionState(syncAllEnquiriesAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-fg-muted">
        New enquiries and consultation bookings are copied to the sheet automatically, and a row updates when its status,
        assignee or follow-up date changes here. Use this button once to copy existing enquiries, or any time to refresh
        the whole sheet. Rows are matched by Enquiry ID, so nothing is duplicated.
      </p>
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
