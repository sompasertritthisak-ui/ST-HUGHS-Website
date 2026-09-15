import Link from "next/link";
import { Columns3, Download, List, Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AUDIENCES, AUDIENCE_LABELS, ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, ENQUIRY_TYPES } from "@/lib/enums";
import type { EnquiryFilters } from "@/lib/admin-ops/enquiries";
import { qs } from "@/lib/admin-ops/form";
import { cn } from "@/lib/utils";

const ENQUIRY_TYPE_LABELS: Record<(typeof ENQUIRY_TYPES)[number], string> = {
  ENQUIRY: "General enquiry",
  CONSULTATION: "Consultation request",
  BROCHURE: "Brochure request",
  VISIT: "Campus visit",
};

const compact = "h-10 text-sm";

export function EnquiryFilterBar({
  filters,
  view,
  params,
  programmes,
  destinations,
  users,
  campaigns,
  canExport,
}: {
  filters: EnquiryFilters;
  view: "list" | "board";
  params: Record<string, string | undefined>;
  programmes: { id: string; title: string }[];
  destinations: { id: string; country: string }[];
  users: { id: string; name: string }[];
  campaigns: string[];
  canExport: boolean;
}) {
  const hasFilters = Object.values(params).some(Boolean);
  const exportHref = `/api/admin/enquiries/export${qs(params)}`;
  const toggle = (v: "list" | "board") => `/admin/enquiries${qs({ ...params, view: v })}`;
  const tabCls = (active: boolean) =>
    cn("inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 text-sm", active ? "border-fg bg-fg text-bg" : "border-line-strong text-fg hover:bg-bg-hover");

  return (
    <form method="get" action="/admin/enquiries" className="rounded-[var(--radius)] border border-line bg-bg-raised p-3 shadow-sm" aria-label="Filter enquiries">
      <input type="hidden" name="view" value={view} />
      {filters.sort !== "createdAt" ? <input type="hidden" name="sort" value={filters.sort} /> : null}
      {filters.dir !== "desc" ? <input type="hidden" name="dir" value={filters.dir} /> : null}
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        <label className="relative xl:col-span-2">
          <span className="sr-only">Search by name or email</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" strokeWidth={1.75} />
          <Input name="q" defaultValue={filters.q ?? ""} placeholder="Search name or email" className={cn(compact, "pl-9")} />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <Select name="status" defaultValue={filters.status ?? ""} className={compact} aria-label="Status">
            <option value="">All statuses</option>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ENQUIRY_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Type</span>
          <Select name="type" defaultValue={filters.type ?? ""} className={compact} aria-label="Type">
            <option value="">All types</option>
            {ENQUIRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ENQUIRY_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Audience</span>
          <Select name="audience" defaultValue={filters.audience ?? ""} className={compact} aria-label="Audience">
            <option value="">All audiences</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABELS[a]}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Programme</span>
          <Select name="programmeId" defaultValue={filters.programmeId ?? ""} className={compact} aria-label="Programme">
            <option value="">All programmes</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Destination</span>
          <Select name="destinationId" defaultValue={filters.destinationId ?? ""} className={compact} aria-label="Destination">
            <option value="">All destinations</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.country}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Assigned counsellor</span>
          <Select name="assignedToId" defaultValue={filters.assignedToId ?? ""} className={compact} aria-label="Assigned counsellor">
            <option value="">Anyone / unassigned</option>
            <option value="unassigned">Unassigned only</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Campaign</span>
          <Select name="utmCampaign" defaultValue={filters.utmCampaign ?? ""} className={compact} aria-label="UTM campaign">
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">From</span>
          <Input type="date" name="from" defaultValue={filters.from ?? ""} className={compact} aria-label="Created from" />
        </label>
        <label className="flex items-center gap-2">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">To</span>
          <Input type="date" name="to" defaultValue={filters.to ?? ""} className={compact} aria-label="Created to" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" variant="secondary">
            Apply filters
          </Button>
          {hasFilters ? (
            <Link href={`/admin/enquiries?view=${view}`} className="inline-flex h-10 items-center gap-1 px-2 text-sm text-fg-muted hover:text-fg">
              <X aria-hidden className="size-3.5" strokeWidth={1.75} /> Clear
            </Link>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canExport ? (
            <a href={exportHref} className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-sm)] border border-line-strong px-3 text-sm text-fg hover:bg-bg-hover" download>
              <Download aria-hidden className="size-4" strokeWidth={1.75} /> Export CSV
            </a>
          ) : null}
          <nav aria-label="View" className="flex items-center gap-1">
            <Link href={toggle("board")} className={tabCls(view === "board")} aria-current={view === "board" ? "page" : undefined}>
              <Columns3 aria-hidden className="size-4" strokeWidth={1.75} /> Board
            </Link>
            <Link href={toggle("list")} className={tabCls(view === "list")} aria-current={view === "list" ? "page" : undefined}>
              <List aria-hidden className="size-4" strokeWidth={1.75} /> List
            </Link>
          </nav>
        </div>
      </div>
    </form>
  );
}

export { ENQUIRY_TYPE_LABELS };
