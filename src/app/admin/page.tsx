import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { CONTENT_STATUSES, CONTENT_STATUS_LABELS } from "@/lib/enums";
import { can } from "@/lib/rbac";
import { formatDate, formatDateTime } from "@/lib/utils";
import { requireUser } from "@/lib/admin/session";
import { awaitingApproval, recentAudit, reviewOverdue, scheduledSoon, statusCountsByEntity, type FlaggedItem } from "@/lib/admin/dashboard";
import { entityHref } from "@/lib/admin/registry";
import { PageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/admin/primitives";
import { buttonClass } from "@/components/admin/button-class";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function FlagList({ items, empty, icon }: { items: FlaggedItem[]; empty: string; icon: React.ReactNode }) {
  if (items.length === 0) return <p className="text-sm text-fg-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((i) => (
        <li key={`${i.def.key}-${i.id}`} className="flex items-center justify-between gap-3 py-2 text-sm">
          <Link href={entityHref(i.def, i.id)} className="min-w-0 truncate font-medium text-fg hover:underline">
            {i.title}
          </Link>
          <span className="flex shrink-0 items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">
            {i.def.labelSingular}
            {i.date ? (
              <span className="inline-flex items-center gap-1">
                {icon}
                {formatDate(i.date, { month: "short" })}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [counts, inReview, overdue, scheduled, audit] = await Promise.all([statusCountsByEntity(), awaitingApproval(), reviewOverdue(), scheduledSoon(), can(user.role, "audit.read") ? recentAudit(10) : Promise.resolve([])]);
  const canApprove = can(user.role, "content.approve");

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${user.name || user.email}. ${canApprove ? "Items awaiting your approval are listed first." : "This overview is read-only for your role."}`} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title={canApprove ? "Awaiting approval" : "In review"} className="lg:col-span-2">
          <FlagList items={inReview} empty="Nothing is waiting for review." icon={<Clock className="size-3" strokeWidth={1.5} aria-hidden />} />
        </Panel>
        <Panel title="Review overdue">
          <FlagList items={overdue} empty="No content is past its review date." icon={<AlertTriangle className="size-3 text-warning" strokeWidth={1.5} aria-hidden />} />
        </Panel>
        <Panel title="Content by status" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">
                  <th scope="col" className="py-1.5 text-left font-normal">Type</th>
                  {CONTENT_STATUSES.map((s) => (
                    <th key={s} scope="col" className="py-1.5 text-right font-normal">
                      {CONTENT_STATUS_LABELS[s]}
                    </th>
                  ))}
                  <th scope="col" className="py-1.5 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {counts.map(({ def, counts: c, total }) => (
                  <tr key={def.key} className="border-t border-line">
                    <th scope="row" className="py-1.5 text-left font-medium">
                      <Link href={entityHref(def)} className="hover:underline">
                        {def.label}
                      </Link>
                    </th>
                    {CONTENT_STATUSES.map((s) => (
                      <td key={s} className="py-1.5 text-right tabular text-fg-muted">
                        {c[s] ? (
                          <Link href={`${entityHref(def)}?status=${s}`} className="hover:underline">
                            {c[s]}
                          </Link>
                        ) : (
                          <span className="text-fg-subtle">·</span>
                        )}
                      </td>
                    ))}
                    <td className="py-1.5 text-right tabular font-medium">{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="flex flex-col gap-5">
          <Panel title="Scheduled">
            <FlagList items={scheduled} empty="Nothing is scheduled." icon={<Clock className="size-3" strokeWidth={1.5} aria-hidden />} />
          </Panel>
          <Panel title="Quick links">
            <div className="flex flex-wrap gap-2">
              {can(user.role, "content.create") ? (
                <>
                  <Link href="/admin/news/new" className={buttonClass("secondary", "sm")}>New article</Link>
                  <Link href="/admin/programmes/new" className={buttonClass("secondary", "sm")}>New programme</Link>
                  <Link href="/admin/pathways/new" className={buttonClass("secondary", "sm")}>New pathway</Link>
                </>
              ) : null}
              {can(user.role, "media.upload") ? <Link href="/admin/media" className={buttonClass("secondary", "sm")}>Upload media</Link> : null}
              {can(user.role, "enquiries.read") ? <Link href="/admin/enquiries" className={buttonClass("secondary", "sm")}>Enquiries</Link> : null}
              <a href="/" target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "sm")}>View site</a>
            </div>
          </Panel>
        </div>
        {can(user.role, "audit.read") ? (
          <Panel title="Recent activity" className="lg:col-span-3" action={<Link href="/admin/audit" className="text-sm text-accent hover:underline">Full audit log</Link>}>
            {audit.length === 0 ? (
              <p className="text-sm text-fg-muted">No activity recorded yet.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {audit.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">{a.action}</span>
                    <span className="font-medium">{a.entityType}</span>
                    {a.entityId ? <span className="font-mono text-xs text-fg-subtle">{a.entityId}</span> : null}
                    <span className="text-fg-muted">by {a.actor?.name ?? "system"}</span>
                    <span className="ml-auto tabular text-fg-subtle">{formatDateTime(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : null}
      </div>
    </>
  );
}
