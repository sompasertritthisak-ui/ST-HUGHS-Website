import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getCampaign } from "@/lib/admin-ops/campaigns";
import { formatDateTime } from "@/lib/utils";
import { EnquiryStatusBadge } from "@/components/ui/verification-badge";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Panel } from "@/components/admin-ops/panel";
import { CampaignForm, DeleteCampaignForm } from "@/components/admin-ops/campaign-form";
import { BarChart } from "@/components/admin-ops/analytics-widgets";

export const metadata: Metadata = { title: "Campaign · SHV CMS" };
export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "campaigns.manage")) return <AccessDenied area="campaigns" />;
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/campaigns" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} /> Back to campaigns
      </Link>
      <PageHeader eyebrow="Campaign" title={campaign.name} lede={<code className="font-mono text-xs">utm_campaign={campaign.utmCampaign}</code>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <Panel title="Details">
            <CampaignForm campaign={campaign} />
          </Panel>
          <Panel title="Events by type" description="Analytics events carrying this utm_campaign (all time).">
            <BarChart id={`campaign-events-${campaign.id}`} title="Events by type" rows={campaign.eventsByName.map((e) => ({ label: e.name, count: e.count }))} />
          </Panel>
        </div>
        <aside className="flex flex-col gap-4">
          <Panel title="Attribution">
            <ul className="grid grid-cols-2 gap-3">
              <li className="rounded-[var(--radius-sm)] border border-line px-3 py-2">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">Enquiries</p>
                <p className="font-display tabular text-3xl text-fg">{campaign.enquiryCount}</p>
              </li>
              <li className="rounded-[var(--radius-sm)] border border-line px-3 py-2">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">Events</p>
                <p className="font-display tabular text-3xl text-fg">{campaign.eventCount}</p>
              </li>
            </ul>
            {campaign.utmCampaign ? (
              <Link href={`/admin/enquiries?view=list&utmCampaign=${encodeURIComponent(campaign.utmCampaign)}`} className="mt-3 inline-block text-sm underline underline-offset-2">
                Open matching enquiries
              </Link>
            ) : null}
          </Panel>
          <Panel title="Recent enquiries">
            {campaign.recentEnquiries.length === 0 ? (
              <p className="text-sm text-fg-subtle">None yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line text-sm">
                {campaign.recentEnquiries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <Link href={`/admin/enquiries/${e.id}`} className="block truncate font-medium text-fg underline-offset-2 hover:underline">
                        {e.name}
                      </Link>
                      <p className="text-xs text-fg-muted">{formatDateTime(e.createdAt)}</p>
                    </div>
                    <EnquiryStatusBadge status={e.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Danger zone">
            <DeleteCampaignForm id={campaign.id} enquiryCount={campaign.enquiryCount} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
