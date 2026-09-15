import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { HrefSchema } from "./form";

export const CampaignInputSchema = z
  .object({
    name: z.string().trim().min(2, "Give the campaign a name.").max(120),
    utmSource: z.string().trim().max(120).optional().default(""),
    utmMedium: z.string().trim().max(120).optional().default(""),
    utmCampaign: z
      .string()
      .trim()
      .min(1, "utm_campaign is required — it is how enquiries and events are matched.")
      .max(120)
      .regex(/^[a-z0-9][a-z0-9._-]*$/i, "Use letters, numbers, dots, dashes or underscores only."),
    landingPage: z.union([z.literal(""), HrefSchema]).optional().default(""),
    startsAt: z.date().nullable(),
    endsAt: z.date().nullable(),
    isActive: z.boolean(),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt >= v.startsAt, { message: "End date must be after the start date.", path: ["endsAt"] });
export type CampaignInput = z.infer<typeof CampaignInputSchema>;

export async function listCampaignsWithCounts() {
  const campaigns = await prisma.campaign.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] });
  const keys = campaigns.map((c) => c.utmCampaign).filter((v): v is string => Boolean(v));
  const [eventCounts, enquiryCounts] = await Promise.all([
    keys.length ? prisma.analyticsEvent.groupBy({ by: ["utmCampaign"], where: { utmCampaign: { in: keys } }, _count: { _all: true } }) : Promise.resolve([]),
    Promise.all(
      campaigns.map((c) =>
        prisma.enquiry.count({
          where: { OR: [{ campaignId: c.id }, ...(c.utmCampaign ? [{ utmCampaign: c.utmCampaign }] : [])] },
        }),
      ),
    ),
  ]);
  const eventMap = new Map(eventCounts.map((e) => [e.utmCampaign, e._count._all]));
  return campaigns.map((c, i) => ({
    ...c,
    enquiryCount: enquiryCounts[i] ?? 0,
    eventCount: c.utmCampaign ? eventMap.get(c.utmCampaign) ?? 0 : 0,
  }));
}

export async function getCampaign(id: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return null;
  const match = { OR: [{ campaignId: id }, ...(campaign.utmCampaign ? [{ utmCampaign: campaign.utmCampaign }] : [])] };
  const [enquiryCount, eventCount, recentEnquiries, eventsByName] = await Promise.all([
    prisma.enquiry.count({ where: match }),
    campaign.utmCampaign ? prisma.analyticsEvent.count({ where: { utmCampaign: campaign.utmCampaign } }) : Promise.resolve(0),
    prisma.enquiry.findMany({ where: match, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, name: true, status: true, createdAt: true, type: true } }),
    campaign.utmCampaign
      ? prisma.analyticsEvent.groupBy({ by: ["name"], where: { utmCampaign: campaign.utmCampaign }, _count: { _all: true }, orderBy: { _count: { name: "desc" } } })
      : Promise.resolve([]),
  ]);
  return { ...campaign, enquiryCount, eventCount, recentEnquiries, eventsByName: eventsByName.map((e) => ({ name: e.name, count: e._count._all })) };
}
