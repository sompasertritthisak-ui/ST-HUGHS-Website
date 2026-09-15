import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Panel } from "@/components/admin-ops/panel";
import { CampaignForm } from "@/components/admin-ops/campaign-form";

export const metadata: Metadata = { title: "New campaign · SHV CMS" };
export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "campaigns.manage")) return <AccessDenied area="campaigns" />;
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/campaigns" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} /> Back to campaigns
      </Link>
      <PageHeader eyebrow="Marketing" title="New campaign" lede="Use the same utm_campaign value in every link for this campaign so attribution lines up." />
      <Panel>
        <CampaignForm />
      </Panel>
    </div>
  );
}
