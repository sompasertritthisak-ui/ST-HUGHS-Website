import Link from "next/link";
import { Search } from "lucide-react";
import { CONTENT_STATUSES, CONTENT_STATUS_LABELS } from "@/lib/enums";
import { Input, Select } from "@/components/ui/field";
import type { EntityDef } from "@/lib/admin/types";
import { buttonClass } from "@/components/admin/button-class";

const control = "h-10 text-sm";

export function ListToolbar({ def, q, status, sort, dir }: { def: EntityDef; q: string; status: string; sort: string; dir: string }) {
  return (
    <form method="get" action={`/admin/${def.key}`} className="mb-4 flex flex-wrap items-end gap-2">
      <div className="min-w-[14rem] flex-1">
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.5} aria-hidden />
          <Input id="q" name="q" type="search" defaultValue={q} placeholder={`Search ${def.label.toLowerCase()}`} className={`${control} pl-9`} maxLength={100} />
        </div>
      </div>
      {def.hasStatus ? (
        <div>
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <Select id="status" name="status" defaultValue={status} className={`${control} w-44`}>
            <option value="">All statuses</option>
            {CONTENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONTENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <div>
        <label htmlFor="sort" className="sr-only">
          Sort by
        </label>
        <Select id="sort" name="sort" defaultValue={sort} className={`${control} w-40`}>
          {def.sortable.map((s) => (
            <option key={s} value={s}>
              {def.listColumns.find((c) => c.key === s)?.label ?? s}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="dir" className="sr-only">
          Direction
        </label>
        <Select id="dir" name="dir" defaultValue={dir} className={`${control} w-32`}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </Select>
      </div>
      <button type="submit" className={buttonClass("secondary")}>
        Apply
      </button>
      {q || status ? (
        <Link href={`/admin/${def.key}`} className={buttonClass("ghost")}>
          Clear
        </Link>
      ) : null}
    </form>
  );
}

export function Pagination({ base, page, pages, total, params }: { base: string; page: number; pages: number; total: number; params: Record<string, string> }) {
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    sp.set("page", String(p));
    return `${base}?${sp}`;
  };
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm text-fg-muted">
      <p>
        {total} item{total === 1 ? "" : "s"} · page {page} of {pages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={buttonClass("secondary", "sm")}>
            Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className={buttonClass("secondary", "sm")}>
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
