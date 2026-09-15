import "server-only";
import { getPathways, getProgrammes, getUniversities, getDestinations, getMessagingSettings } from "@/lib/content";

/**
 * Server-side data shaping for the interactive tools (explorer, compare,
 * finder). Everything is PUBLISHED content from the public read layer. The
 * returned objects are passed straight to client components; React Server
 * Components serialise Date fields, so no extra transformation is needed.
 */
export async function getExplorerData() {
  const [pathways, programmes, universities, destinations, messaging] = await Promise.all([
    getPathways(),
    getProgrammes(),
    getUniversities(),
    getDestinations(),
    getMessagingSettings(),
  ]);
  return {
    pathways,
    programmes,
    universities,
    // Destinations are trimmed to what the map and pickers need.
    destinations: destinations.map((d) => ({
      id: d.id,
      slug: d.slug,
      country: d.country,
      isoCode: d.isoCode,
      region: d.region,
      lat: d.lat,
      lng: d.lng,
      verificationStatus: d.verificationStatus,
      routeCount: d.pathways.length,
    })),
    messaging,
  };
}

export type ExplorerData = Awaited<ReturnType<typeof getExplorerData>>;
export type ExplorerDestination = ExplorerData["destinations"][number];
