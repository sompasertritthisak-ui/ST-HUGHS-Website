import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { can } from "@/lib/rbac";
import { requireUser } from "@/lib/admin/session";
import { getEntity, entityHref } from "@/lib/admin/registry";
import { listEntity, type ListParams } from "@/lib/admin/queries";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { ListToolbar, Pagination } from "@/components/admin/list-toolbar";
import { buttonClass } from "@/components/admin/button-class";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ entity: string }>; searchParams: Promise<ListParams & { created?: string; deleted?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = getEntity((await params).entity);
  return { title: def?.label ?? "Not found" };
}

export default async function EntityListPage({ params, searchParams }: Props) {
  const def = getEntity((await params).entity);
  if (!def) notFound();
  const user = await requireUser();
  const sp = await searchParams;
  const result = await listEntity(def, sp);
  const canCreate = can(user.role, "content.create");

  return (
    <>
      <PageHeader
        title={def.label}
        description={def.description}
        crumbs={[{ label: "Dashboard", href: "/admin" }]}
        actions={
          canCreate ? (
            <Link href={`${entityHref(def)}/new`} className={buttonClass("primary")}>
              <Plus className="size-4" strokeWidth={1.75} aria-hidden /> New {def.labelSingular.toLowerCase()}
            </Link>
          ) : null
        }
      />
      {sp.deleted ? (
        <p role="status" className="mb-4 rounded-[var(--radius-sm)] border border-success/40 bg-bg-raised px-3 py-2 text-sm text-success">
          {def.labelSingular} deleted.
        </p>
      ) : null}
      <ListToolbar def={def} q={result.q} status={result.status} sort={result.sort} dir={result.dir} />
      <DataTable columns={def.listColumns} rows={result.rows} hrefFor={(row) => entityHref(def, row.id)} emptyTitle={result.q || result.status ? "No matches" : `No ${def.label.toLowerCase()} yet`} emptyBody={result.q || result.status ? "Try a different search or clear the filters." : canCreate ? `Create the first ${def.labelSingular.toLowerCase()} to get started.` : undefined} />
      <Pagination base={entityHref(def)} page={result.page} pages={result.pages} total={result.total} params={{ q: result.q, status: result.status, sort: result.sort, dir: result.dir }} />
    </>
  );
}
