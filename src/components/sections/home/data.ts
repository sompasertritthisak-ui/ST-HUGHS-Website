import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import {
  getContactSettings,
  getDestinations,
  getFacilities,
  getMessagingSettings,
  getNews,
  getOutcomeMetrics,
  getPathways,
  getProgrammes,
  getStudentStories,
  getUniversities,
  type DestinationWithRelations,
} from "@/lib/content";
import type { GlobeDestination } from "@/components/three/geo";

/**
 * Homepage-only data access. Anything reusable should graduate to
 * `src/lib/content.ts`; until then it lives here, PUBLISHED-only.
 */

export const InstitutionSettingsSchema = z.object({
  established: z.number().default(2023),
  authorisation: z.string().default(""),
  authorisationSource: z.string().optional().default(""),
  ncukStudyCentre: z.boolean().default(false),
  ncukSince: z.string().default(""),
  sisterInstitution: z.string().default(""),
  vision: z.string().optional().default(""),
  mission: z.string().optional().default(""),
  governanceNote: z.string().optional().default(""),
});
export type InstitutionSettings = z.infer<typeof InstitutionSettingsSchema>;

export async function getInstitutionSettings(): Promise<InstitutionSettings> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "institution" } });
  const fallback = InstitutionSettingsSchema.parse({});
  return parseJson(row?.valueJson, InstitutionSettingsSchema, fallback);
}

export function getPublishedRouteCount() {
  return prisma.pathway.count({ where: { status: "PUBLISHED" } });
}

/** Plain JSON for the client-side globe — no Prisma objects cross the boundary. */
export function toGlobeDestinations(destinations: DestinationWithRelations[]): GlobeDestination[] {
  return destinations.map((d) => ({
    slug: d.slug,
    country: d.country,
    isoCode: d.isoCode,
    lat: d.lat,
    lng: d.lng,
    verified: d.verificationStatus === "VERIFIED",
  }));
}

export async function getHomeData() {
  const [messaging, contact, institution, destinations, pathways, programmes, universities, facilities, metrics, stories, news, routeCount] =
    await Promise.all([
      getMessagingSettings(),
      getContactSettings(),
      getInstitutionSettings(),
      getDestinations(),
      getPathways({ featured: true }),
      getProgrammes({ featured: true }),
      getUniversities({ featured: true }),
      getFacilities(),
      getOutcomeMetrics(),
      getStudentStories({ featured: true, take: 3 }),
      getNews({ take: 3 }),
      getPublishedRouteCount(),
    ]);
  return { messaging, contact, institution, destinations, pathways, programmes, universities, facilities, metrics, stories, news, routeCount };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
