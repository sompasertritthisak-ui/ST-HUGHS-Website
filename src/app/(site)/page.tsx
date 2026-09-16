import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/utils";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { FinalCta } from "@/components/sections/final-cta";
import {
  CampusStrip,
  Employability,
  ExplorerTeaser,
  FeaturedProgrammes,
  GlobalNetwork,
  Hero,
  LoadingSequence,
  NewsSection,
  PathwayStatement,
  StudentExperience,
  StudentStories,
  WhyStHughs,
} from "@/components/sections/home";
import { getHomeData, toGlobeDestinations } from "@/components/sections/home/data";
import { LifeMosaic } from "@/components/sections/home/life-mosaic";
import { Milestones } from "@/components/sections/home/milestones";

const TITLE = "St Hugh's College Vientiane — International university pathways from Laos";
const DESCRIPTION =
  "St Hugh's College Vientiane is an NCUK Study Centre in Lao PDR. Begin the International Foundation Year or International Year One in Vientiane and progress to universities in the UK, Australia, New Zealand, North America and Asia.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website" },
};

/**
 * The homepage is a journey, not a template stack:
 * Origin (hero) → the route (statement) → why (evidence) → Pathway (explorer) →
 * Foundation (programmes) → Destination (network) → Student life → Campus →
 * Future (employability) → Stories → News → Start here (consultation, final CTA).
 */
export default async function HomePage() {
  const data = await getHomeData();
  const globeDestinations = toGlobeDestinations(data.destinations);
  const { contact, messaging, institution } = data;

  const sameAs = Object.values(contact.social ?? {}).filter((v): v is string => typeof v === "string" && v.length > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: contact.institutionName,
    alternateName: contact.shortName,
    url: absoluteUrl("/"),
    foundingDate: String(institution.established ?? 2023),
    description: DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.addressLines.join(", "),
      addressLocality: "Vientiane",
      addressCountry: "LA",
    },
    ...(contact.emails[0] ? { email: contact.emails[0] } : {}),
    ...(contact.phones[0] ? { telephone: contact.phones[0] } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* 1 — loading sequence (≤ 900ms, once per session, never blocks) */}
      <LoadingSequence line1={messaging.heroLine1} line2={messaging.heroLine2} />

      {/* 2 — Origin */}
      <Hero messaging={messaging} destinations={globeDestinations} routeCount={data.routeCount} established={institution.established} />

      {/* 3 — the route in one sentence */}
      <LifeMosaic />
      <PathwayStatement destinations={data.destinations} />

      {/* 4 — evidence */}
      <WhyStHughs institution={institution} />
      <Milestones />

      {/* 5 — Pathway */}
      <ExplorerTeaser pathways={data.pathways} />

      {/* 6 — Foundation */}
      <FeaturedProgrammes programmes={data.programmes} />

      {/* 7 — Destination */}
      <GlobalNetwork destinations={data.destinations} universities={data.universities} />

      {/* 8 — Student experience */}
      <StudentExperience facilities={data.facilities} />

      {/* 9 — Campus */}
      <CampusStrip facilities={data.facilities} addressLine={contact.addressLines[1] ?? contact.addressLines[0]} />

      {/* 10 — Future */}
      <Employability metrics={data.metrics} />

      {/* 11 — Stories (consent-gated) */}
      <StudentStories stories={data.stories} />

      {/* 12 — News */}
      <NewsSection news={data.news} />

      {/* 13 + 14 — Consultation and apply */}
      <ConsultationBand
        title="Talk it through with an advisor"
        body="A free consultation checks your qualifications against the published entry requirements and sets out a clear next step. It is guidance to help you plan, not a formal admissions decision."
        primaryHref="/consultation"
        primaryLabel="Book a free consultation"
        secondaryHref="/admissions"
        secondaryLabel="How to apply"
      />

      {/* 15 — Start here */}
      <FinalCta />
    </>
  );
}
