import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { AnalyticsEventName } from "@/lib/enums";

export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export function parseRange(raw: string | undefined): AnalyticsRange {
  const n = Number(raw);
  return (ANALYTICS_RANGES as readonly number[]).includes(n) ? (n as AnalyticsRange) : 30;
}

const PropsSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

/** propsJson is written by the public tracker; treat it as untrusted. */
export function parseProps(raw: string | null | undefined): Record<string, string | number | boolean> {
  if (!raw) return {};
  try {
    const r = PropsSchema.safeParse(JSON.parse(raw));
    return r.success ? r.data : {};
  } catch {
    return {};
  }
}

export type RankRow = { label: string; count: number; secondary?: number; href?: string };

export type AnalyticsSummary = {
  rangeDays: AnalyticsRange;
  since: string;
  generatedAt: string;
  kpis: {
    pageViews: number;
    uniqueSessions: number;
    programmeViews: number;
    pathwayInteractions: number;
    destinationClicks: number;
    universityClicks: number;
    enquiries: number;
    consultationRequests: number;
    applyClicks: number;
    brochureDownloads: number;
    outboundPartnerClicks: number;
  };
  funnel: { stage: string; label: string; count: number; optional: boolean; hint: string }[];
  topPages: RankRow[];
  topProgrammes: RankRow[];
  topDestinations: RankRow[];
  campaignsByEnquiries: RankRow[];
  sources: RankRow[];
  referrers: RankRow[];
  eventsByDay: { day: string; count: number }[];
};

function slugFromPath(path: string | null | undefined, prefix: string): string | null {
  if (!path) return null;
  const m = path.match(new RegExp(`^/${prefix}/([^/?#]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function rank(map: Map<string, number>, take = 10, hrefFor?: (label: string) => string): RankRow[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([label, count]) => ({ label, count, href: hrefFor?.(label) }));
}

async function distinctSessions(names: AnalyticsEventName[], since: Date): Promise<number> {
  const rows = await prisma.analyticsEvent.groupBy({
    by: ["sessionId"],
    where: { name: { in: names }, createdAt: { gte: since }, sessionId: { not: null } },
  });
  return rows.length;
}

export async function getAnalyticsSummary(rangeDays: AnalyticsRange): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - rangeDays * 86_400_000);
  since.setHours(0, 0, 0, 0);
  const inRange = { createdAt: { gte: since } };

  const [byName, uniqueSessions, programmeSessions, pathwaySessions, enquiries, consultations, applications, enrolments, topPagesRaw, programmeEvents, destinationEvents, campaignRaw, enquirySources, eventSources, referrerRaw, allEventDates] =
    await Promise.all([
      prisma.analyticsEvent.groupBy({ by: ["name"], where: inRange, _count: { _all: true } }),
      prisma.analyticsEvent.groupBy({ by: ["sessionId"], where: { ...inRange, sessionId: { not: null } } }).then((rows) => rows.length),
      distinctSessions(["programme_view"], since),
      distinctSessions(["pathway_interaction", "explorer_completed"], since),
      prisma.enquiry.count({ where: inRange }),
      prisma.consultation.count({ where: inRange }),
      // Cumulative: anyone who reached application stage, including those who went on to convert.
      prisma.enquiry.count({ where: { ...inRange, status: { in: ["APPLICATION_STARTED", "APPLICATION_SUBMITTED", "CONVERTED"] } } }),
      prisma.enquiry.count({ where: { ...inRange, status: "CONVERTED" } }),
      prisma.analyticsEvent.groupBy({ by: ["path"], where: { ...inRange, name: "page_view", path: { not: null } }, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 10 }),
      prisma.analyticsEvent.findMany({ where: { ...inRange, name: "programme_view" }, select: { path: true, propsJson: true } }),
      prisma.analyticsEvent.findMany({ where: { ...inRange, name: "destination_click" }, select: { path: true, propsJson: true } }),
      prisma.enquiry.groupBy({ by: ["utmCampaign"], where: { ...inRange, utmCampaign: { not: null } }, _count: { _all: true }, orderBy: { _count: { utmCampaign: "desc" } }, take: 10 }),
      prisma.enquiry.groupBy({ by: ["utmSource"], where: { ...inRange, utmSource: { not: null } }, _count: { _all: true } }),
      prisma.analyticsEvent.groupBy({ by: ["utmSource"], where: { ...inRange, utmSource: { not: null } }, _count: { _all: true } }),
      prisma.analyticsEvent.groupBy({ by: ["referrer"], where: { ...inRange, name: "page_view", referrer: { not: null } }, _count: { _all: true } }),
      prisma.analyticsEvent.findMany({ where: inRange, select: { createdAt: true } }),
    ]);

  const count = (name: AnalyticsEventName) => byName.find((r) => r.name === name)?._count._all ?? 0;

  const programmeMap = new Map<string, number>();
  for (const e of programmeEvents) {
    const props = parseProps(e.propsJson);
    const key = (typeof props.slug === "string" && props.slug) || slugFromPath(e.path, "programmes") || e.path || "unknown";
    programmeMap.set(key, (programmeMap.get(key) ?? 0) + 1);
  }
  const destinationMap = new Map<string, number>();
  for (const e of destinationEvents) {
    const props = parseProps(e.propsJson);
    const key = (typeof props.slug === "string" && props.slug) || (typeof props.country === "string" && props.country) || slugFromPath(e.path, "destinations") || e.path || "unknown";
    destinationMap.set(key, (destinationMap.get(key) ?? 0) + 1);
  }

  // Campaign names for the utm_campaign keys we saw.
  const campaignKeys = campaignRaw.map((c) => c.utmCampaign).filter((v): v is string => Boolean(v));
  const campaigns = campaignKeys.length ? await prisma.campaign.findMany({ where: { utmCampaign: { in: campaignKeys } }, select: { id: true, name: true, utmCampaign: true } }) : [];
  const campaignName = new Map(campaigns.map((c) => [c.utmCampaign, c]));

  const sourceMap = new Map<string, number>();
  for (const r of enquirySources) if (r.utmSource) sourceMap.set(r.utmSource, (sourceMap.get(r.utmSource) ?? 0) + r._count._all);
  const eventSourceMap = new Map<string, number>();
  for (const r of eventSources) if (r.utmSource) eventSourceMap.set(r.utmSource, (eventSourceMap.get(r.utmSource) ?? 0) + r._count._all);

  const referrerMap = new Map<string, number>();
  for (const r of referrerRaw) {
    if (!r.referrer) continue;
    let host = r.referrer;
    try {
      host = new URL(r.referrer).hostname.replace(/^www\./, "");
    } catch {
      /* keep raw */
    }
    referrerMap.set(host, (referrerMap.get(host) ?? 0) + r._count._all);
  }

  const dayMap = new Map<string, number>();
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(since.getTime() + i * 86_400_000);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const e of allEventDates) {
    const key = e.createdAt.toISOString().slice(0, 10);
    if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }

  const funnel: AnalyticsSummary["funnel"] = [
    { stage: "VISITOR", label: "Visitor", count: uniqueSessions, optional: false, hint: "Unique sessions" },
    { stage: "PROGRAMME", label: "Programme", count: programmeSessions, optional: false, hint: "Sessions that viewed a programme" },
    { stage: "PATHWAY", label: "Pathway", count: pathwaySessions, optional: false, hint: "Sessions that used a pathway tool" },
    { stage: "ENQUIRY", label: "Enquiry", count: enquiries, optional: false, hint: "Enquiries received" },
    { stage: "CONSULTATION", label: "Consultation", count: consultations, optional: false, hint: "Consultation requests" },
    { stage: "APPLICATION", label: "Application", count: applications, optional: true, hint: "Enquiries at application started / submitted" },
    { stage: "ENROLMENT", label: "Enrolment", count: enrolments, optional: true, hint: "Enquiries marked converted" },
  ];

  return {
    rangeDays,
    since: since.toISOString(),
    generatedAt: new Date().toISOString(),
    kpis: {
      pageViews: count("page_view"),
      uniqueSessions,
      programmeViews: count("programme_view"),
      pathwayInteractions: count("pathway_interaction") + count("explorer_completed"),
      destinationClicks: count("destination_click"),
      universityClicks: count("university_click"),
      enquiries,
      consultationRequests: consultations,
      applyClicks: count("apply_click"),
      brochureDownloads: count("brochure_download"),
      outboundPartnerClicks: count("outbound_partner_click"),
    },
    funnel,
    topPages: topPagesRaw.map((r) => ({ label: r.path ?? "—", count: r._count._all })),
    topProgrammes: rank(programmeMap, 10, (slug) => (slug.startsWith("/") ? slug : `/programmes/${slug}`)),
    topDestinations: rank(destinationMap, 10, (slug) => (slug.startsWith("/") ? slug : `/destinations/${slug}`)),
    campaignsByEnquiries: campaignRaw.map((r) => {
      const c = r.utmCampaign ? campaignName.get(r.utmCampaign) : undefined;
      return { label: c ? `${c.name} (${r.utmCampaign})` : r.utmCampaign ?? "—", count: r._count._all, href: c ? `/admin/campaigns/${c.id}` : undefined };
    }),
    sources: [...new Set([...sourceMap.keys(), ...eventSourceMap.keys()])]
      .map((k) => ({ label: k, count: eventSourceMap.get(k) ?? 0, secondary: sourceMap.get(k) ?? 0 }))
      .sort((a, b) => b.secondary - a.secondary || b.count - a.count)
      .slice(0, 10),
    referrers: rank(referrerMap, 10),
    eventsByDay: [...dayMap.entries()].map(([day, c]) => ({ day, count: c })),
  };
}
