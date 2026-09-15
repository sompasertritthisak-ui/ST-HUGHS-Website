import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { getExplorerData } from "@/components/explorer/data";
import { CompareTool } from "@/components/explorer/compare-tool";

export const metadata: Metadata = {
  title: "Compare your options",
  description:
    "Compare St Hugh's College programmes and pathways side by side: duration, location, structure, destination, qualification, entry and English requirements, progression and transfer point.",
};

export default async function ComparePage() {
  const { programmes, pathways, messaging } = await getExplorerData();
  return (
    <>
      <PageHero
        eyebrow="Compare your options"
        title={
          <>
            Two or three routes, <span className="italic text-gold-soft">side by side.</span>
          </>
        }
        lede="Put programmes and pathways next to each other to see how the duration, the destination, the requirements and the transfer point differ before you talk to an advisor."
      />
      <Suspense fallback={<div className="container-x pb-20 text-sm text-fg-muted">Loading options…</div>}>
        <CompareTool programmes={programmes} pathways={pathways} disclaimer={messaging.guidanceDisclaimer} />
      </Suspense>
      <ConsultationBand
        title="Still weighing it up?"
        body="An advisor can walk through the differences with you and check which requirements you already meet."
        secondaryHref="/pathway-explorer"
        secondaryLabel="Open the Pathway Explorer"
      />
    </>
  );
}
