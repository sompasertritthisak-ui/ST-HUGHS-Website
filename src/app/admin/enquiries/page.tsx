import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { boardEnquiries, filtersToParams, listAssignableUsers, listDestinationOptions, listEnquiries, listProgrammeOptions, listUtmCampaignOptions, parseEnquiryFilters } from "@/lib/admin-ops/enquiries";
import { sp } from "@/lib/admin-ops/form";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { EnquiryFilterBar } from "@/components/admin-ops/enquiry-filters";
import { EnquiryBoard } from "@/components/admin-ops/enquiry-board";
import { EnquiryTable } from "@/components/admin-ops/enquiry-table";

export const metadata: Metadata = { title: "Enquiries · SHV CMS", description: "Enquiry pipeline and lead management." };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "enquiries.read")) return <AccessDenied area="enquiries" />;

  const params = await searchParams;
  const view = sp(params, "view") === "list" ? "list" : "board";
  const filters = parseEnquiryFilters(params);
  const flat = filtersToParams(filters);

  const [programmes, destinations, users, campaigns] = await Promise.all([listProgrammeOptions(), listDestinationOptions(), listAssignableUsers(), listUtmCampaignOptions()]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Admissions" title="Enquiries" lede="Every enquiry, consultation request, brochure request and visit request from the public site. Private to admissions staff." />
      <EnquiryFilterBar filters={filters} view={view} params={flat} programmes={programmes} destinations={destinations} users={users} campaigns={campaigns} canExport={can(user.role, "enquiries.export")} />
      {view === "board" ? <BoardView filters={filters} /> : <ListView filters={filters} params={flat} />}
    </div>
  );
}

async function BoardView({ filters }: { filters: Awaited<ReturnType<typeof parseEnquiryFilters>> }) {
  const { byStatus, countMap } = await boardEnquiries(filters);
  return <EnquiryBoard byStatus={byStatus} countMap={countMap} />;
}

async function ListView({ filters, params }: { filters: Awaited<ReturnType<typeof parseEnquiryFilters>>; params: Record<string, string | undefined> }) {
  const { rows, total } = await listEnquiries(filters);
  return <EnquiryTable rows={rows} total={total} filters={filters} params={params} />;
}
