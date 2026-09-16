import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { getExplorerData } from "@/components/explorer/data";
import { PathwayExplorer } from "@/components/explorer/pathway-explorer";

export const metadata: Metadata = {
  title: "Pathway Explorer",
  description:
    "Choose your starting point, programme, subject and destination and watch your route from Vientiane to a degree abroad draw itself on the map. Every option is a published St Hugh's College route.",
};

export default async function PathwayExplorerPage() {
  const { messaging, ...data } = await getExplorerData();
  return (
    <>
      <PageHero
        eyebrow="Pathway Explorer"
        title={
          <>
            Draw your route <span className="italic text-brand-soft">from Laos</span> to the world.
          </>
        }
        lede="Start in Vientiane. Choose a programme, a subject and a destination, and the route to your degree appears step by step — with the university, the qualification and where it can lead."
        aside={
          <p className="text-sm leading-relaxed text-fg-muted">
            Only published routes are shown. Where a partnership is still being confirmed, the route carries a verification label. {messaging.guidanceDisclaimer}
          </p>
        }
      />
      <Suspense fallback={<div className="container-x pb-20 text-sm text-fg-muted">Loading routes…</div>}>
        <PathwayExplorer data={data} />
      </Suspense>
      <ConsultationBand
        title="Want an advisor to check this route with you?"
        body="Book a free consultation. An advisor confirms the entry requirements, the English level and the timeline for the route you have drawn."
        secondaryHref="/pathway-finder"
        secondaryLabel="Try the Pathway Finder"
      />
    </>
  );
}
