import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { StatusBadge, VerificationBadge } from "@/components/ui/verification-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import type { AdminRecord, ListColumn } from "@/lib/admin/types";

const dash = <span className="text-fg-subtle">—</span>;

function Cell({ column, value }: { column: ListColumn; value: unknown }) {
  const empty = value === null || value === undefined || value === "";
  switch (column.kind) {
    case "status":
      return typeof value === "string" ? <StatusBadge status={value} /> : null;
    case "verification":
      return typeof value === "string" ? <VerificationBadge status={value} /> : null;
    case "date":
      return <span className="whitespace-nowrap tabular text-fg-muted">{value instanceof Date ? formatDate(value, { month: "short" }) : dash}</span>;
    case "boolean":
      return value ? <Check className="size-4 text-success" strokeWidth={1.75} aria-label="Yes" /> : <Minus className="size-4 text-fg-subtle" strokeWidth={1.5} aria-label="No" />;
    case "mono":
      return <span className="font-mono text-xs text-fg-muted">{empty ? dash : String(value)}</span>;
    case "number":
      return <span className="tabular">{empty ? dash : String(value)}</span>;
    default:
      return <span className="text-fg">{empty ? dash : String(value)}</span>;
  }
}

export function DataTable({ columns, rows, hrefFor, emptyTitle = "Nothing here yet", emptyBody }: { columns: ListColumn[]; rows: AdminRecord[]; hrefFor: (row: AdminRecord) => string; emptyTitle?: string; emptyBody?: string }) {
  if (rows.length === 0) return <EmptyState title={emptyTitle} body={emptyBody} />;
  return (
    <div className="max-h-[70vh] overflow-auto rounded-[var(--radius)] border border-line bg-bg-raised shadow-sm">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-bg-raised">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="border-b border-line px-3 py-2.5 text-left font-mono text-[0.625rem] font-normal uppercase tracking-[0.14em] text-fg-subtle">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-bg-hover">
              {columns.map((c, i) => (
                <td key={c.key} className="px-3 py-2.5 align-middle">
                  {i === 0 ? (
                    <Link href={hrefFor(row)} className="font-medium text-fg underline-offset-4 hover:underline">
                      <Cell column={c} value={row[c.key]} />
                    </Link>
                  ) : (
                    <Cell column={c} value={row[c.key]} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
