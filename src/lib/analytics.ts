import "server-only";
import { prisma } from "./prisma";
import { z } from "zod";
import { AnalyticsEventSchema } from "./enums";

export const TrackEventSchema = z.object({
  name: AnalyticsEventSchema,
  path: z.string().max(500).optional(),
  props: z.record(z.string(), z.union([z.string().max(300), z.number(), z.boolean()])).optional(),
  sessionId: z.string().max(64).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  referrer: z.string().max(500).optional(),
});
export type TrackEventInput = z.infer<typeof TrackEventSchema>;

export async function trackEvent(input: TrackEventInput) {
  await prisma.analyticsEvent.create({
    data: {
      name: input.name,
      path: input.path ?? null,
      propsJson: JSON.stringify(input.props ?? {}),
      sessionId: input.sessionId ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      referrer: input.referrer ?? null,
    },
  });
}
