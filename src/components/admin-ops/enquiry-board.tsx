import Link from "next/link";
import { CalendarClock, UserRound } from "lucide-react";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, AUDIENCE_LABELS, type Audience } from "@/lib/enums";
import type { EnquiryListRow } from "@/lib/admin-ops/enquiries";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function isOverdue(followUpAt: Date | null, status: string) {
  if (!followUpAt) return false;
  if (status === "CONVERTED" || status === "NOT_PROCEEDING" || status === "ARCHIVED") return false;
  return followUpAt.getTime() < Date.now();
}

export function EnquiryCard({ e }: { e: EnquiryListRow }) {
  const overdue = isOverdue(e.followUpAt, e.status);
  return (
    <li>
      <Link
        href={`/admin/enquiries/${e.id}`}
        className={cn("block rounded-[var(--radius-sm)] border bg-bg-raised p-3 text-sm shadow-sm transition-colors hover:border-fg/40 focus-visible:border-fg", overdue ? "border-danger/50" : "border-line")}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-fg">{e.name}</p>
          <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">{AUDIENCE_LABELS[e.audience as Audience] ?? e.audience}</span>
        </div>
        {e.programme ? <p className="mt-1 truncate text-fg-muted">{e.programme.title}</p> : null}
        {e.destination ? <p className="mt-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">→ {e.destination.country}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
          <span>{formatDate(e.createdAt, { month: "short" })}</span>
          {e.assignedTo ? (
            <span className="inline-flex items-center gap-1">
              <UserRound aria-hidden className="size-3" strokeWidth={1.75} />
              {e.assignedTo.name}
            </span>
          ) : (
            <span className="text-fg-subtle">Unassigned</span>
          )}
          {e.followUpAt ? (
            <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-danger")}>
              <CalendarClock aria-hidden className="size-3" strokeWidth={1.75} />
              {overdue ? "Overdue · " : "Follow up · "}
              {formatDate(e.followUpAt, { month: "short" })}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

export function EnquiryBoard({ byStatus, countMap }: { byStatus: Map<string, EnquiryListRow[]>; countMap: Map<string, number> }) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <ol className="flex min-w-max gap-3 px-1" aria-label="Enquiry pipeline by status">
        {ENQUIRY_STATUSES.map((status) => {
          const rows = byStatus.get(status) ?? [];
          const total = countMap.get(status) ?? 0;
          return (
            <li key={status} className="flex w-72 shrink-0 flex-col rounded-[var(--radius)] border border-line bg-bg-hover/40">
              <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg">{ENQUIRY_STATUS_LABELS[status]}</h2>
                <span className="tabular rounded-[var(--radius-sm)] bg-bg-raised px-1.5 py-0.5 font-mono text-[0.6875rem] text-fg-muted" aria-label={`${total} enquiries`}>
                  {total}
                </span>
              </header>
              {rows.length ? (
                <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-2">
                  {rows.map((e) => (
                    <EnquiryCard key={e.id} e={e} />
                  ))}
                  {total > rows.length ? (
                    <li className="px-1 py-2 text-center text-xs text-fg-muted">
                      <Link href={`/admin/enquiries?view=list&status=${status}`} className="underline underline-offset-2 hover:text-fg">
                        View all {total} in list
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="px-3 py-6 text-center text-xs text-fg-subtle">None</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
