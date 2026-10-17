import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/utils";
import { FinalCta } from "@/components/sections/final-cta";
import { FeaturedProgrammes, Hero, LoadingSequence, RouteJourney, WhyStHughs } from "@/components/sections/home";
import { getHomeData, toGlobeDestinations } from "@/components/sections/home/data";
import { DestinationsCompact } from "@/components/sections/home/destinations-compact";
import { LifeMosaic } from "@/components/sections/home/life-mosaic";
import { SectionSpine } from "@/components/site/section-spine";
import { CinematicScene } from "@/components/cinematic/cinematic-scene";
import { CINEMATIC } from "@/components/cinematic/media";
import { RouteRibbon } from "@/components/three/route-ribbon";

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
  { id: "programmes-title", label: "Programmes" },
  { id: "destinations-title", label: "Destinations" },
  { id: "life-title", label: "Life at SHV" },
  { id: "why-title", label: "Why St Hugh's" },
  { id: "final-cta", label: "Start here" },
];

/**
 * The homepage is deliberately short. It is written for someone who has never heard of
 * St Hugh's and answers only the crucial questions; everything else is one click away on its
 * own page. White is the ground; deep blue appears only where the cinema needs it (the hero with
 * the globe, the three chapter openers, the closing scene) and red is the stroke.
 *
 *  1. Hero              Who and where is this?            (the globe)
 *  2. How it works      One year at home, then the world  (3 steps, 4 verified numbers)
 *  3. Chapter 1 → Programmes     What would I study?       (→ /programmes)
 *  4. Chapter 2 → Destinations   Where can it take me?     (→ /destinations, /universities)
 *  5. Chapter 3 → Life at SHV    Is it a real place?       (→ /student-life, /campus)
 *  6. Why St Hugh's     Can I trust it? (four sourced facts → /why-st-hughs)
 *  7. Start here        The one conversion: a free consultation
 *
 * Moved to their own pages: the timeline (/about), the pathway tool (/pathway-explorer), outcomes
 * (/careers), student stories (/student-stories), news (/news), campus walk (/campus).
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

      <LoadingSequence line1={messaging.heroLine1} line2={messaging.heroLine2} />

      {/* 1 — Origin */}
      <Hero messaging={messaging} destinations={globeDestinations} routeCount={data.routeCount} established={institution.established} />

      {/* 2 — How it works */}
      <RouteJourney destinations={globeDestinations} counts={data.counts} />

      {/* 3 — Programmes */}
      <CinematicScene
        id="chapter-programmes"
        index={1}
        total={3}
        eyebrow="The programmes"
        title="Taught here."
        accent="Recognised there."
        media={CINEMATIC.learning}
        cta={{ href: "/programmes", label: "See the programmes" }}
      />
      <FeaturedProgrammes programmes={data.programmes} />

      {/* 4 — Destinations */}
      <CinematicScene
        id="chapter-destinations"
        index={2}
        total={3}
        eyebrow="Destinations"
        title="Where the line"
        accent="leads."
        backdrop={<RouteRibbon destinations={globeDestinations} className="absolute inset-0" />}
        cta={{ href: "/destinations", label: "Every destination" }}
        align="center"
      />
      <DestinationsCompact destinations={data.destinations} universities={data.universities} />

      {/* 5 — Life at SHV */}
      <CinematicScene
        id="chapter-campus"
        index={3}
        total={3}
        eyebrow="A year in Vientiane"
        title="A year at home,"
        accent="lived fully."
        media={{ poster: "/media/students/Class_1.jpg", position: "50% 40%" }}
        cta={{ href: "/student-life", label: "Student life at SHV" }}
      />
      <LifeMosaic />

      {/* 6 — Trust */}
      <WhyStHughs institution={institution} limit={3} />

      {/* 7 — Start here */}
      <FinalCta />
    </>
  );
}
