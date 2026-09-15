import { AlertTriangle } from "lucide-react";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { AdminRecord, EntityDef } from "@/lib/admin/types";
import { Panel } from "./primitives";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <dt className="shrink-0 text-fg-subtle">{label}</dt>
      <dd className="text-right text-fg">{children}</dd>
    </div>
  );
}

const asDate = (v: unknown) => (v instanceof Date ? v : null);

export function GovernancePanel({ def, record, ownerName }: { def: EntityDef; record: AdminRecord; ownerName: string | null }) {
  const has = (name: string) => def.fields.some((f) => f.name === name);
  const reviewDate = asDate(record.reviewDate);
  const overdue = reviewDate ? reviewDate < new Date() : false;
  const updatedAt = asDate(record.updatedAt);
  const publishAt = asDate(record.publishAt);
  return (
    <Panel title="Governance">
      <dl className="divide-y divide-line">
        {has("verificationStatus") ? <Row label="Verification">{typeof record.verificationStatus === "string" ? <VerificationBadge status={record.verificationStatus} /> : "—"}</Row> : null}
        {has("ownerId") ? <Row label="Owner">{ownerName ?? <span className="text-fg-subtle">Unassigned</span>}</Row> : null}
        <Row label="Last updated">{updatedAt ? formatDateTime(updatedAt) : "—"}</Row>
        {has("effectiveDate") ? <Row label="Effective">{formatDate(asDate(record.effectiveDate)) || "—"}</Row> : null}
        {has("reviewDate") ? (
          <Row label="Review due">
            {reviewDate ? (
              <span className={overdue ? "inline-flex items-center gap-1 text-warning" : undefined}>
                {overdue ? <AlertTriangle className="size-3.5" strokeWidth={1.5} aria-hidden /> : null}
                {formatDate(reviewDate)}
                {overdue ? <span className="sr-only">(overdue)</span> : null}
              </span>
            ) : (
              "—"
            )}
          </Row>
        ) : null}
        {def.hasPublishAt ? <Row label="Publish at">{publishAt ? formatDateTime(publishAt) : <span className="text-fg-subtle">On publish</span>}</Row> : null}
        {has("consentStatus") ? <Row label="Consent">{String(record.consentStatus ?? "—")}</Row> : null}
      </dl>
      {has("sourceNote") ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">Source</p>
          <p className="mt-1 text-sm text-fg-muted">{typeof record.sourceNote === "string" && record.sourceNote ? record.sourceNote : "No source recorded."}</p>
        </div>
      ) : null}
    </Panel>
  );
}
