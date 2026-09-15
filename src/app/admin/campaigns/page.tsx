import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listCampaignsWithCounts } from "@/lib/admin-ops/campaigns";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { EmptyRow, Table, Td, Th, Tr } from "@/components/admin-ops/table";

export const metadata: Metadata = { title: "Campaigns · SHV CMS", description: "Marketing campaigns and attribution." };
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "campaigns.manage")) return <AccessDenied area="campaigns" />;

  const campaigns = await listCampaignsWithCounts();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Marketing"
        title="Campaigns"
        lede="Each campaign is keyed by utm_campaign. Enquiries and analytics events carrying that value are attributed to it automatically."
        actions={
          <Button href="/admin/campaigns/new" size="sm">
            <Plus aria-hidden className="size-4" strokeWidth={1.75} /> New campaign
          </Button>
        }
      />
      <Table caption="Campaigns">
        <thead>
          <tr>
            <Th>Campaign</Th>
            <Th>utm_campaign</Th>
            <Th>Source / medium</Th>
            <Th>Landing page</Th>
            <Th>Window</Th>
            <Th className="text-right">Enquiries</Th>
            <Th className="text-right">Events</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {campaigns.length === 0 ? (
            <EmptyRow colSpan={8}>No campaigns yet. Create one to start attributing enquiries.</EmptyRow>
          ) : (
            campaigns.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <Link href={`/admin/campaigns/${c.id}`} className="font-medium text-fg underline-offset-2 hover:underline">
                    {c.name}
                  </Link>
                </Td>
                <Td className="font-mono text-xs">{c.utmCampaign ?? <span className="text-fg-subtle">—</span>}</Td>
                <Td className="font-mono text-xs text-fg-muted">{[c.utmSource, c.utmMedium].filter(Boolean).join(" / ") || "—"}</Td>
                <Td className="font-mono text-xs text-fg-muted">{c.landingPage ?? "—"}</Td>
                <Td className="whitespace-nowrap text-xs text-fg-muted">
                  {c.startsAt || c.endsAt ? `${c.startsAt ? formatDate(c.startsAt, { month: "short" }) : "…"} → ${c.endsAt ? formatDate(c.endsAt, { month: "short" }) : "…"}` : "Open-ended"}
                </Td>
                <Td className="tabular text-right">
                  <Link href={`/admin/enquiries?view=list&utmCampaign=${encodeURIComponent(c.utmCampaign ?? "")}`} className="underline-offset-2 hover:underline">
                    {c.enquiryCount}
                  </Link>
                </Td>
                <Td className="tabular text-right">{c.eventCount}</Td>
                <Td>{c.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
