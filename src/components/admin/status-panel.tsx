"use client";

import { useActionState } from "react";
import { changeStatus } from "@/lib/admin/actions";
import { idle } from "@/lib/admin/types";
import { CONTENT_STATUS_LABELS, type ContentStatus } from "@/lib/enums";
import { StatusBadge } from "@/components/ui/verification-badge";
import { ActionMessage, ConfirmSubmit, Panel, SubmitButton } from "./primitives";
import { useActionToast } from "./toast";

const VERB: Record<string, string> = { IN_REVIEW: "Submit for review", APPROVED: "Approve", PUBLISHED: "Publish", ARCHIVED: "Archive", DRAFT: "Return to draft" };

export function StatusPanel({ entityKey, id, status, allowed, scheduled }: { entityKey: string; id: string; status: string; allowed: string[]; scheduled?: string | null }) {
  const [state, action] = useActionState(changeStatus, idle);
  useActionToast(state);
  return (
    <Panel title="Workflow">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-fg-muted">Current status</span>
        <StatusBadge status={status} />
      </div>
      {scheduled ? <p className="mt-2 text-sm text-fg-muted">Scheduled to go live {scheduled}.</p> : null}
      {allowed.length ? (
        <ul className="mt-4 flex flex-col gap-2">
          {allowed.map((to) => {
            const destructive = to === "ARCHIVED" || (status === "PUBLISHED" && to === "DRAFT");
            return (
              <li key={to}>
                <form action={action} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="entity" value={entityKey} />
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="to" value={to} />
                  {destructive ? (
                    <ConfirmSubmit label={VERB[to] ?? to} confirmLabel={`Confirm: ${VERB[to] ?? to}`} size="sm" description={status === "PUBLISHED" ? "This removes the item from the public site." : undefined} />
                  ) : (
                    <SubmitButton variant={to === "PUBLISHED" ? "primary" : "secondary"} size="sm">
                      {VERB[to] ?? to}
                    </SubmitButton>
                  )}
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">to {CONTENT_STATUS_LABELS[to as ContentStatus] ?? to}</span>
                </form>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-fg-subtle">No transitions available for your role from this status.</p>
      )}
      <ActionMessage state={state} className="mt-3" />
    </Panel>
  );
}
