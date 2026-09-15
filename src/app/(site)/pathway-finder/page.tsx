import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { getExplorerData } from "@/components/explorer/data";
import { PathwayFinder } from "@/components/explorer/pathway-finder";

export const metadata: Metadata = {
  title: "Pathway Finder",
  description:
    "Answer seven short questions about your qualification, subject, preferred country, English level and timeline to see which published St Hugh's College routes fit — guidance to help you plan, not an admissions decision.",
};

export default async function PathwayFinderPage() {
  const { pathways, programmes, destinations, messaging } = await getExplorerData();
  return (
    <>
      <PageHero
        eyebrow="Pathway Finder"
        title={
          <>
            Seven questions. <span className="italic text-gold-soft">A clearer next step.</span>
          </>
        }
        lede="Tell us where you are today and where you would like to be. We match your answers against the published routes and give you a short list to bring to your consultation."
        aside={<p className="text-sm leading-relaxed text-fg-muted">{messaging.guidanceDisclaimer}</p>}
      />
      <PathwayFinder pathways={pathways} programmes={programmes} destinations={destinations} disclaimer={messaging.guidanceDisclaimer} />
      <ConsultationBand
        title="Ready to talk it through?"
        body="Bring your shortlist to a free consultation. An advisor checks your qualifications and English level against the entry requirements and confirms the timeline."
        secondaryHref="/pathway-explorer"
        secondaryLabel="Draw the route on the map"
      />
    </>
  );
}
