import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { AUDIT_PAGE_SIZE, auditFilterOptions, auditFiltersToParams, listAuditLogs, parseAuditFilters } from "@/lib/admin-ops/audit-log";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Pagination } from "@/components/admin-ops/pagination";
import { AuditDiff, AuditFilterBar } from "@/components/admin-ops/audit-widgets";

export const metadata: Metadata = { title: "Audit log · SHV CMS", description: "Who changed what, and when." };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const ACTION_TONE: Record<string, "neutral" | "gold" | "success" | "warning" | "danger" | "accent"> = {
  CREATE: "success",
  UPDATE: "accent",
  DELETE: "danger",
  PUBLISH: "success",
  UNPUBLISH: "warning",
  LOGIN: "neutral",
  LOGIN_FAILED: "danger",
  ROLLBACK: "warning",
  UPLOAD: "accent",
  STATUS_CHANGE: "accent",
};

const th = "border-b border-line bg-bg-hover/60 px-3 py-2 text-left font-mono text-[0.6875rem] font-normal uppercase tracking-[0.14em] text-fg-muted";

export default async function AuditPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "audit.read")) return <AccessDenied area="the audit log" />;

  const params = await searchParams;
  const filters = parseAuditFilters(params);
  const [{ rows, total }, options] = await Promise.all([listAuditLogs(filters), auditFilterOptions()]);
  const flat = auditFiltersToParams(filters);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Governance" title="Audit log" lede="Every create, update, delete, publish, login and status change. Expand a row to compare before and after." />
      <AuditFilterBar filters={filters} actors={options.actors} entityTypes={options.entityTypes} />
      <div className="overflow-x-auto rounded-[var(--radius)] border border-line bg-bg-raised shadow-sm">
        <table className="w-full border-collapse text-sm text-fg">
          <caption className="sr-only">Audit entries</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>
                When
              </th>
              <th scope="col" className={th}>
                Actor
              </th>
              <th scope="col" className={th}>
                Action
              </th>
              <th scope="col" className={th}>
                Entity
              </th>
              <th scope="col" className={th}>
                IP
              </th>
              <th scope="col" className={th}>
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-fg-muted">
                  No audit entries match these filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const hasDetail = Boolean(r.beforeJson || r.afterJson);
                return (
                  <tr key={r.id} className="align-top hover:bg-bg-hover/40">
                    <td className="whitespace-nowrap border-b border-line px-3 py-2 text-fg-muted">
                      <time dateTime={r.createdAt.toISOString()}>{formatDateTime(r.createdAt)}</time>
                    </td>
                    <td className="whitespace-nowrap border-b border-line px-3 py-2">
                      {r.actor ? (
                        <Link href={`/admin/audit?actorId=${r.actor.id}`} className="underline-offset-2 hover:underline">
                          {r.actor.name}
                        </Link>
                      ) : (
                        <span className="text-fg-subtle">System</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap border-b border-line px-3 py-2">
                      <Badge tone={ACTION_TONE[r.action] ?? "neutral"}>{r.action.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="border-b border-line px-3 py-2">
                      <span className="font-medium">{r.entityType}</span>
                      {r.entityId ? (
                        <Link href={`/admin/audit?entityType=${encodeURIComponent(r.entityType)}&entityId=${encodeURIComponent(r.entityId)}`} className="ml-2 font-mono text-xs text-fg-muted underline-offset-2 hover:underline">
                          {r.entityId}
                        </Link>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs text-fg-muted">{r.ip ?? "—"}</td>
                    <td className="border-b border-line px-3 py-2">
                      {hasDetail ? (
                        <details className="group">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-fg underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
                            Details <ChevronDown aria-hidden className="size-3.5 transition-transform group-open:rotate-180" strokeWidth={1.75} />
                          </summary>
                          <div className="mt-3 w-[min(70vw,56rem)]">
                            <AuditDiff beforeJson={r.beforeJson} afterJson={r.afterJson} />
                          </div>
                        </details>
                      ) : (
                        <span className="text-xs text-fg-subtle">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={filters.page} pageSize={AUDIT_PAGE_SIZE} total={total} params={flat} />
    </div>
  );
}
