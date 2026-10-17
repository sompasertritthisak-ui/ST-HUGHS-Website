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
  RouteJourney,
  StudentExperience,
  StudentStories,
  WhyStHughs,
} from "@/components/sections/home";
import { getHomeData, toGlobeDestinations } from "@/components/sections/home/data";
import { LifeMosaic } from "@/components/sections/home/life-mosaic";
import { Milestones } from "@/components/sections/home/milestones";
import { FlagStripe } from "@/components/ui/flag-stripe";
import { SectionSpine } from "@/components/site/section-spine";
import { CinematicScene } from "@/components/cinematic/cinematic-scene";
import { CINEMATIC } from "@/components/cinematic/media";

const TITLE = "St Hugh's College Vientiane — International university pathways from Laos";
const DESCRIPTION =
  "St Hugh's College Vientiane is an NCUK Study Centre in Lao PDR. Begin the International Foundation Year or International Year One in Vientiane and progress to universities in the UK, Australia, New Zealand, North America and Asia.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website" },
};

/** The acts of the homepage, in order, for the wayfinding spine. Ids are the act headings. */
const SPINE = [
  { id: "hero-title", label: "Origin" },
  { id: "journey-title", label: "How it works" },
  { id: "life-title", label: "Life at SHV" },
  { id: "why-title", label: "Why St Hugh's" },
  { id: "programmes-title", label: "Programmes" },
  { id: "explorer-title", label: "Your pathway" },
  { id: "network-title", label: "Destinations" },
  { id: "experience-title", label: "Student life" },
  { id: "campus-title", label: "Campus" },
  { id: "milestones-title", label: "Track record" },
  { id: "future-title", label: "Future" },
  { id: "stories-title", label: "Stories" },
  { id: "news-title", label: "News" },
  { id: "final-cta", label: "Start here" },
];

/**
 * The homepage is written for someone who has never heard of St Hugh's. Each act answers
 * one question, in the order a family asks them:
 *
 *  1. Hero            Who and where is this?                      (origin, the globe)
 *  2. RouteJourney    How does it work?                           (one year at home, then the world; proof numbers)
 *  3. LifeMosaic      Is it a real place with real students?      (photography only, no stock)
 *  4. WhyStHughs      Can I trust it?                             (authorisation, NCUK, sourced claims)
 *  5. Programmes      What would I study?                         (the taught programmes)
 *  6. Explorer        Which route is mine?                        (the tool)
 *  7. GlobalNetwork   Where can it take me?                       (destinations and universities)
 *  8. StudentLife     What is learning here like?
 *  9. Campus          Where will I spend the year?
 * 10. Milestones      How established is it?                      (dated public record)
 * 11. Employability   What happens after?                         (verified figures only)
 * 12. Stories         Who has done it?                            (consent-gated)
 * 13. News            Is it alive?
 * 14. Consultation    What do I do now?                           (the one conversion)
 * 15. FinalCta        Start here.
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

      <SectionSpine stops={SPINE} />

      {/* loading sequence (≤ 900ms, once per session, never blocks) */}
      <LoadingSequence line1={messaging.heroLine1} line2={messaging.heroLine2} />

      {/* 1 — Origin */}
      <Hero messaging={messaging} destinations={globeDestinations} routeCount={data.routeCount} established={institution.established} />

      {/* 2 — How it works: the red band continues straight on from the hero's wayfinding strip */}
      <RouteJourney destinations={globeDestinations} counts={data.counts} />

      {/* 3 — Real place, real people */}
      <LifeMosaic />

      {/* 4 — Trust */}
      <WhyStHughs institution={institution} />

      {/* 5 — What you study (chapter opener, then the programmes) */}
      <CinematicScene
        id="chapter-programmes"
        index={1}
        total={3}
        eyebrow="The programmes"
        title="Taught here."
        accent="Recognised there."
        body="Seminar rooms in Vientiane where the first year of an international degree is taught in English, to the standard the partner universities set."
        media={CINEMATIC.learning}
        cta={{ href: "/programmes", label: "See the programmes" }}
      />
      <FeaturedProgrammes programmes={data.programmes} />

      {/* 6 — Your pathway (the tool) */}
      <FlagStripe />
      <ExplorerTeaser pathways={data.pathways} />

      {/* 7 — Destinations and universities (chapter opener, then the board) */}
      <CinematicScene
        id="chapter-destinations"
        index={2}
        total={3}
        eyebrow="Destinations"
        title="Where the line"
        accent="leads."
        body="Ten countries, each reached by a published route. The line that starts on the terrace in Vientiane lands at a partner university."
        media={CINEMATIC.world}
        cta={{ href: "/destinations", label: "Every destination" }}
        align="center"
      />
      <GlobalNetwork destinations={data.destinations} universities={data.universities} />

      {/* 8 — Student life (chapter opener, then the detail) */}
      <CinematicScene
        id="chapter-campus"
        index={3}
        total={3}
        eyebrow="A year in Vientiane"
        title="A year at home,"
        accent="lived fully."
        body="Small classes, close support and a city you already know, before the move abroad."
        media={CINEMATIC.campus}
        cta={{ href: "/student-life", label: "Student life at SHV" }}
      />
      <StudentExperience facilities={data.facilities} />

      {/* 9 — Campus */}
      <CampusStrip facilities={data.facilities} addressLine={contact.addressLines[1] ?? contact.addressLines[0]} />

      {/* 10 — Track record */}
      <Milestones />

      {/* 11 — Future */}
      <Employability metrics={data.metrics} />

      {/* 12 — Stories (consent-gated) */}
      <StudentStories stories={data.stories} />

      {/* 13 — News */}
      <NewsSection news={data.news} />

      {/* 14 — The conversion */}
      <ConsultationBand
        tone="band"
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
