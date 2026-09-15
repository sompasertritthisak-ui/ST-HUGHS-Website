import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STATUS_TRANSITIONS, type ContentStatus } from "@/lib/enums";
import { can, canTransitionTo } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { requireUser } from "@/lib/admin/session";
import { getEntity, entityHref, recordTitle } from "@/lib/admin/registry";
import { getRecord, loadMediaPreviews, loadRelationOptions, ownerName } from "@/lib/admin/queries";
import { toFormValues } from "@/lib/admin/schema";
import type { AdminRecord } from "@/lib/admin/types";
import { StatusBadge } from "@/components/ui/verification-badge";
import { PageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { StatusPanel } from "@/components/admin/status-panel";
import { GovernancePanel } from "@/components/admin/governance-panel";
import { MetaPanel } from "@/components/admin/meta-panel";
import { ChildList } from "@/components/admin/child-list";
import { BlockBuilder } from "@/components/admin/block-builder";

export const dynamic = "force-dynamic";

const ID_RE = /^[a-z0-9_-]{5,64}$/i;
type Props = { params: Promise<{ entity: string; id: string }>; searchParams: Promise<{ created?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entity, id } = await params;
  const def = getEntity(entity);
  if (!def || !ID_RE.test(id)) return { title: "Not found" };
  const record = await getRecord(def, id);
  return { title: record ? `${recordTitle(def, record)} — ${def.labelSingular}` : "Not found" };
}

export default async function EditEntityPage({ params, searchParams }: Props) {
  const { entity, id } = await params;
  const def = getEntity(entity);
  if (!def || !ID_RE.test(id)) notFound();
  const user = await requireUser();
  const record = await getRecord(def, id);
  if (!record) notFound();
  const [relationOptions, mediaPreviews, owner, sp] = await Promise.all([loadRelationOptions(def.fields), loadMediaPreviews(def.fields, record), ownerName(record), searchParams]);

  const canWrite = can(user.role, "content.update");
  const status = String(record.status ?? "DRAFT") as ContentStatus;
  const allowed = def.hasStatus ? (STATUS_TRANSITIONS[status] ?? []).filter((to) => canTransitionTo(user.role, to)) : [];
  const publishAt = record.publishAt instanceof Date ? record.publishAt : null;
  const scheduled = status === "PUBLISHED" && publishAt && publishAt > new Date() ? formatDateTime(publishAt) : null;

  return (
    <>
      <PageHeader title={recordTitle(def, record)} crumbs={[{ label: "Dashboard", href: "/admin" }, { label: def.label, href: entityHref(def) }]} badge={def.hasStatus ? <StatusBadge status={status} /> : null} />
      {sp.created ? (
        <p role="status" className="mb-4 rounded-[var(--radius-sm)] border border-success/40 bg-bg-raised px-3 py-2 text-sm text-success">
          {def.labelSingular} created as a draft. {def.children?.length || def.hasBlocks ? "You can now add inline items below." : ""}
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <EntityForm entityKey={def.key} id={record.id} fields={def.fields} values={toFormValues(def.fields, record)} relationOptions={relationOptions} mediaPreviews={mediaPreviews} canWrite={canWrite} listHref={entityHref(def)} />
          {def.children?.map((child) => <ChildList key={child.key} entityKey={def.key} parentId={record.id} child={child} rows={(Array.isArray(record[child.key]) ? record[child.key] : []) as AdminRecord[]} canWrite={canWrite} />)}
          {def.hasBlocks ? <BlockBuilder pageId={record.id} blocks={(Array.isArray(record.blocks) ? record.blocks : []) as Parameters<typeof BlockBuilder>[0]["blocks"]} canWrite={canWrite} /> : null}
        </div>
        <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
          {def.hasStatus ? <StatusPanel entityKey={def.key} id={record.id} status={status} allowed={allowed} scheduled={scheduled} /> : null}
          <GovernancePanel def={def} record={record} ownerName={owner} />
          <MetaPanel def={def} record={record} canDelete={can(user.role, "content.delete")} />
        </aside>
      </div>
    </>
  );
}
