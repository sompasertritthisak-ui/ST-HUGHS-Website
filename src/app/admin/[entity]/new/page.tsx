import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { requireUser } from "@/lib/admin/session";
import { getEntity, entityHref } from "@/lib/admin/registry";
import { loadRelationOptions } from "@/lib/admin/queries";
import { toFormValues } from "@/lib/admin/schema";
import { PageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ entity: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = getEntity((await params).entity);
  return { title: def ? `New ${def.labelSingular.toLowerCase()}` : "Not found" };
}

export default async function NewEntityPage({ params }: Props) {
  const def = getEntity((await params).entity);
  if (!def) notFound();
  const user = await requireUser();
  if (!can(user.role, "content.create")) redirect(entityHref(def));
  const relationOptions = await loadRelationOptions(def.fields);

  return (
    <>
      <PageHeader title={`New ${def.labelSingular.toLowerCase()}`} crumbs={[{ label: "Dashboard", href: "/admin" }, { label: def.label, href: entityHref(def) }]} description={def.children?.length || def.hasBlocks ? "Save the record first; inline items and blocks become available on the edit page." : undefined} />
      <div className="max-w-5xl">
        <EntityForm entityKey={def.key} id={null} fields={def.fields} values={toFormValues(def.fields, null)} relationOptions={relationOptions} mediaPreviews={{}} canWrite listHref={entityHref(def)} />
      </div>
    </>
  );
}
