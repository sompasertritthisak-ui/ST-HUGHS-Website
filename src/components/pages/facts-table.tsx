import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type Fact = { label: string; value?: ReactNode | null; pending?: string };

/** Mono definition list. Empty values render the pending phrase, never a dash-only cell. */
export function FactsTable({ rows, columns = 2, className }: { rows: Fact[]; columns?: 1 | 2; className?: string }) {
  return (
    <dl className={cn("grid gap-x-10 border-t border-line", columns === 2 ? "sm:grid-cols-2" : "", className)}>
      {rows.map((row) => {
        const empty = row.value === null || row.value === undefined || row.value === "";
        return (
          <div key={row.label} className="grid gap-2 border-b border-line py-4">
            <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft">{row.label}</dt>
            <dd className={cn("text-[1rem] leading-relaxed", empty ? "text-fg-subtle" : "text-fg")}>{empty ? row.pending ?? "Confirmed by the admissions team" : row.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
