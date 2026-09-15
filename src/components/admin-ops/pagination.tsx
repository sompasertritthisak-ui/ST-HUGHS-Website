import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, pageSize, total, params }: { page: number; pageSize: number; total: number; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) {
    return <p className="mt-3 text-xs text-fg-muted">{total === 0 ? "No results" : `${total} result${total === 1 ? "" : "s"}`}</p>;
  }
  const href = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
    u.set("page", String(p));
    return `?${u.toString()}`;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const linkCls = "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-line-strong px-2.5 text-xs text-fg hover:bg-bg-hover aria-disabled:pointer-events-none aria-disabled:opacity-40";
  return (
    <nav aria-label="Pagination" className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-fg-muted">
      <p>
        Showing <span className="tabular text-fg">{from}–{to}</span> of <span className="tabular text-fg">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Link href={href(Math.max(1, page - 1))} aria-disabled={page <= 1} className={linkCls} rel="prev">
          <ChevronLeft aria-hidden className="size-3.5" strokeWidth={1.75} /> Previous
        </Link>
        <span className={cn(linkCls, "border-transparent")} aria-current="page">
          Page {page} of {pages}
        </span>
        <Link href={href(Math.min(pages, page + 1))} aria-disabled={page >= pages} className={linkCls} rel="next">
          Next <ChevronRight aria-hidden className="size-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </nav>
  );
}
