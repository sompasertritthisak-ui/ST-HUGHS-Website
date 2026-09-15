import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ANALYTICS_RANGES, getAnalyticsSummary, parseRange } from "@/lib/admin-ops/analytics";
import { sp } from "@/lib/admin-ops/form";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Panel } from "@/components/admin-ops/panel";
import { BarChart, Funnel, KpiTiles, RankTable, Sparkline } from "@/components/admin-ops/analytics-widgets";

export const metadata: Metadata = { title: "Analytics · SHV CMS", description: "First-party engagement and conversion analytics." };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "analytics.read")) return <AccessDenied area="analytics" />;

  const params = await searchParams;
  const range = parseRange(sp(params, "range"));
  const data = await getAnalyticsSummary(range);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Insight"
        title="Analytics"
        lede={`First-party events only — no third-party trackers. Since ${formatDate(data.since)}.`}
        actions={
          <nav aria-label="Date range" className="flex items-center gap-1">
            {ANALYTICS_RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/analytics?range=${r}`}
                aria-current={r === range ? "page" : undefined}
                className={cn("inline-flex h-10 items-center rounded-[var(--radius-sm)] border px-3 text-sm", r === range ? "border-fg bg-fg text-bg" : "border-line-strong text-fg hover:bg-bg-hover")}
              >
                {r} days
              </Link>
            ))}
            <a href={`/api/admin/analytics?range=${range}`} className="ml-2 inline-flex h-10 items-center px-2 font-mono text-xs text-fg-muted hover:text-fg">
              JSON
            </a>
          </nav>
        }
      />

      <KpiTiles kpis={data.kpis} />

      <Panel title="Activity" description="All events per day.">
        <Sparkline points={data.eventsByDay} title="Events per day" />
      </Panel>

      <Funnel stages={data.funnel} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top pages" description="Page views by path.">
          <BarChart id="top-pages" title="Top pages" rows={data.topPages} valueLabel="Views" />
        </Panel>
        <Panel title="Top programmes" description="programme_view events by programme.">
          <BarChart id="top-programmes" title="Top programmes" rows={data.topProgrammes} valueLabel="Views" />
        </Panel>
        <Panel title="Top destinations" description="destination_click events by destination.">
          <BarChart id="top-destinations" title="Top destinations" rows={data.topDestinations} valueLabel="Clicks" />
        </Panel>
        <Panel title="Campaigns by enquiries" description="Enquiries carrying a utm_campaign.">
          <BarChart id="campaigns" title="Campaigns by enquiries" rows={data.campaignsByEnquiries} valueLabel="Enquiries" />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RankTable title="Sources" rows={data.sources} labelHeader="utm_source" countHeader="Events" secondaryHeader="Enquiries" />
        <RankTable title="Referrers" rows={data.referrers} labelHeader="Referring host" countHeader="Page views" />
        <RankTable title="Campaigns" rows={data.campaignsByEnquiries} labelHeader="Campaign" countHeader="Enquiries" />
      </div>

      <p className="text-xs text-fg-subtle">Generated {formatDate(data.generatedAt, { hour: "2-digit", minute: "2-digit" })}. Enrolment figures appear once enquiries are marked converted.</p>
    </div>
  );
}
