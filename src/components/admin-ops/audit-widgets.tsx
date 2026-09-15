import Link from "next/link";
import { X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AUDIT_ACTIONS } from "@/lib/enums";
import type { AuditFilters } from "@/lib/admin-ops/audit-log";
import { diffJson } from "@/lib/admin-ops/audit-log";
import { cn } from "@/lib/utils";

const compact = "h-10 text-sm";

export function AuditFilterBar({ filters, actors, entityTypes }: { filters: AuditFilters; actors: { id: string; name: string }[]; entityTypes: string[] }) {
  const hasFilters = Boolean(filters.actorId || filters.action || filters.entityType || filters.entityId || filters.from || filters.to);
  return (
    <form method="get" action="/admin/audit" className="rounded-[var(--radius)] border border-line bg-bg-raised p-3 shadow-sm" aria-label="Filter audit log">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        <Select name="actorId" defaultValue={filters.actorId ?? ""} className={compact} aria-label="Actor">
          <option value="">Any actor</option>
          <option value="system">System (no actor)</option>
          {actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Select name="action" defaultValue={filters.action ?? ""} className={compact} aria-label="Action">
          <option value="">Any action</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </Select>
        <Select name="entityType" defaultValue={filters.entityType ?? ""} className={compact} aria-label="Entity type">
          <option value="">Any entity</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Input name="entityId" defaultValue={filters.entityId ?? ""} placeholder="Entity id" className={`${compact} font-mono`} aria-label="Entity id" />
        <Input type="date" name="from" defaultValue={filters.from ?? ""} className={compact} aria-label="From date" />
        <Input type="date" name="to" defaultValue={filters.to ?? ""} className={compact} aria-label="To date" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button type="submit" size="sm" variant="secondary">
          Apply filters
        </Button>
        {hasFilters ? (
          <Link href="/admin/audit" className="inline-flex h-10 items-center gap-1 px-2 text-sm text-fg-muted hover:text-fg">
            <X aria-hidden className="size-3.5" strokeWidth={1.75} /> Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function JsonBlock({ value, changed, side }: { value: unknown; changed: Set<string>; side: "before" | "after" }) {
  if (value === null || value === undefined) return <p className="text-xs text-fg-subtle">— none —</p>;
  if (typeof value !== "object" || Array.isArray(value)) {
    return <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-[var(--radius-sm)] bg-bg-hover p-3 font-mono text-xs text-fg">{JSON.stringify(value, null, 2)}</pre>;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort((a, b) => Number(changed.has(b)) - Number(changed.has(a)) || a.localeCompare(b));
  return (
    <pre className="overflow-x-auto rounded-[var(--radius-sm)] bg-bg-hover p-3 font-mono text-xs leading-5 text-fg" aria-label={`${side} snapshot`}>
      {"{\n"}
      {keys.map((k) => {
        const isChanged = changed.has(k);
        return (
          <span key={k} className={cn("block whitespace-pre-wrap break-all pl-4", isChanged && (side === "before" ? "bg-danger/10 text-fg" : "bg-success/15 text-fg"))}>
            {isChanged ? <span aria-hidden className="-ml-3 mr-1 inline-block w-2 text-fg-muted">{side === "before" ? "−" : "+"}</span> : null}
            <span className="text-fg-muted">&quot;{k}&quot;</span>: {JSON.stringify(obj[k], null, 2)}
            {isChanged ? <span className="sr-only"> (changed)</span> : null}
          </span>
        );
      })}
      {"}"}
    </pre>
  );
}

export function AuditDiff({ beforeJson, afterJson }: { beforeJson: string | null; afterJson: string | null }) {
  const { before, after, changed } = diffJson(beforeJson, afterJson);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <p className="mb-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">Before</p>
        <JsonBlock value={before} changed={changed} side="before" />
      </div>
      <div>
        <p className="mb-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">
          After {changed.size ? <span className="ml-2 text-fg">· {changed.size} key{changed.size === 1 ? "" : "s"} changed</span> : null}
        </p>
        <JsonBlock value={after} changed={changed} side="after" />
      </div>
    </div>
  );
}
