import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/rbac";
import { listRevisions } from "@/lib/audit";
import { formatDateTime } from "@/lib/utils";
import { requireUser } from "@/lib/admin/session";
import { getEntity, entityHref, recordTitle } from "@/lib/admin/registry";
import { getRecord } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/admin/primitives";
import { buttonClass } from "@/components/admin/button-class";
import { RevisionDiff } from "@/components/admin/revision-diff";
import { RestoreForm } from "@/components/admin/restore-form";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Revisions" };

const ID_RE = /^[a-z0-9_-]{5,64}$/i;
type Props = { params: Promise<{ entity: string; id: string }>; searchParams: Promise<{ v?: string }> };

export default async function RevisionsPage({ params, searchParams }: Props) {
  const { entity, id } = await params;
  const def = getEntity(entity);
  if (!def || !ID_RE.test(id)) notFound();
  const user = await requireUser();
  const [record, revisions, sp] = await Promise.all([getRecord(def, id), listRevisions(def.type, id), searchParams]);
  if (!record) notFound();
  const selected = revisions.find((r) => r.id === sp.v) ?? revisions[0] ?? null;
  let snapshot: Record<string, unknown> | null = null;
  if (selected) {
    try {
      snapshot = JSON.parse(selected.snapshotJson) as Record<string, unknown>;
    } catch {
      snapshot = null;
    }
  }
  const base = `${entityHref(def, id)}/revisions`;

  return (
    <>
      <PageHeader title="Revision history" description={`${recordTitle(def, record)} · ${revisions.length} version${revisions.length === 1 ? "" : "s"} (most recent 50).`} crumbs={[{ label: "Dashboard", href: "/admin" }, { label: def.label, href: entityHref(def) }, { label: recordTitle(def, record), href: entityHref(def, id) }]} actions={<Link href={entityHref(def, id)} className={buttonClass("secondary")}>Back to record</Link>} />
      {revisions.length === 0 ? (
        <EmptyState title="No revisions yet" body="A snapshot is taken automatically before every update, status change and rollback." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Panel title="Versions" className="lg:self-start">
            <ol className="-m-2 flex flex-col">
              {revisions.map((r) => (
                <li key={r.id}>
                  <Link href={`${base}?v=${r.id}`} aria-current={selected?.id === r.id ? "true" : undefined} className={cn("flex flex-col gap-0.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-bg-hover", selected?.id === r.id && "bg-bg-hover")}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-fg">v{r.version}</span>
                      <span className="tabular text-xs text-fg-subtle">{formatDateTime(r.createdAt)}</span>
                    </span>
                    <span className="text-fg-muted">{r.author?.name ?? "system"}</span>
                    {r.note ? <span className="text-xs text-fg-subtle">{r.note}</span> : null}
                  </Link>
                </li>
              ))}
            </ol>
          </Panel>
          {selected ? (
            <Panel title={`Version ${selected.version} vs current`} action={can(user.role, "content.rollback") ? <RestoreForm entityKey={def.key} id={id} revisionId={selected.id} version={selected.version} /> : null}>
              <p className="mb-3 text-sm text-fg-muted">
                Snapshot taken {formatDateTime(selected.createdAt)} by {selected.author?.name ?? "system"}
                {selected.note ? ` — ${selected.note}` : ""}.
              </p>
              {snapshot ? <RevisionDiff then={snapshot} now={record} /> : <p className="text-sm text-danger">This snapshot could not be read.</p>}
            </Panel>
          ) : null}
        </div>
      )}
    </>
  );
}
