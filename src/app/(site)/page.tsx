import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/utils";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero, LoadingSequence, RouteJourney, WhyStHughs } from "@/components/sections/home";
import { getHomeData, toGlobeDestinations } from "@/components/sections/home/data";
import { PartnerStrip } from "@/components/sections/home/partner-strip";
import { ProgrammesAtAGlance } from "@/components/sections/home/programmes-at-a-glance";
import { ChooseYourRoute } from "@/components/sections/home/choose-your-route";
import { Scholarships } from "@/components/sections/scholarships";
import { LifeMosaic } from "@/components/sections/home/life-mosaic";
import { WorkWithUs } from "@/components/sections/home/work-with-us";
import { SectionSpine } from "@/components/site/section-spine";
import { CinematicScene } from "@/components/cinematic/cinematic-scene";
import { CINEMATIC } from "@/components/cinematic/media";
import { RouteRibbon } from "@/components/three/route-ribbon";
import { AmbientToggle } from "@/components/site/ambient-toggle";
import { AlumniVoices } from "@/components/sections/alumni-voices";

const TITLE = "St Hugh's College Vientiane — International university pathways from Laos";
const DESCRIPTION =
  "St Hugh's College Vientiane is an NCUK Study Centre in Lao PDR. Begin in Vientiane with an NCUK programme or a partner degree route, and progress to universities in the UK, Europe, Australia, New Zealand, North America and Asia.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website" },
};

/** The acts of the homepage, in order, for the wayfinding spine. Ids are the act headings. */
const SPINE = [
  { id: "hero-title", label: "Origin" },
  { id: "journey-title", label: "Your pathway" },
  { id: "programmes-title", label: "Programmes" },
  { id: "routes-title", label: "Study routes" },
  { id: "scholarships-title", label: "Scholarships" },
  { id: "life-title", label: "Life at SHV" },
  { id: "alumni-title", label: "Alumni" },
  { id: "why-title", label: "Why St Hugh's" },
  { id: "work-title", label: "Work with us" },
  { id: "final-cta", label: "Start here" },
];

/**
 * The homepage is deliberately short. It is written for someone who has never heard of
 * St Hugh's and answers only the crucial questions; everything else is one click away on its
 * own page. White is the ground; deep blue appears only where the cinema needs it (the hero with
 * the globe, the three chapter openers, the closing scene) and red is the stroke.
 *
 *  1. Hero              Who and where is this?            (the globe) + partner logos
 *  2. Your pathway      Start in Laos. Go beyond borders. (NCUK abroad | BBA in Laos, side by side, 3 stages each)
 *  3. Chapter 1 → Programmes at a glance   BBA + NCUK flagships, every other option, short courses
 *  4. Chapter 2 → Choose your route         six routes with partner logos (→ programme pages)
 *  5. Scholarships      Go further, for less              (sourced figures → /scholarships)
 *  6. Chapter 3 → Life at SHV    Is it a real place?       (→ /student-life, /campus)
 *  7. Alumni voices     Did it work for people like me?
 *  8. Why St Hugh's     Can I trust it?
 *  9. Work with us · 10. Start here
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
      <AmbientToggle />

      <LoadingSequence line1={messaging.heroLine1} line2={messaging.heroLine2} />

      {/* 1 — Origin */}
      <Hero messaging={messaging} destinations={globeDestinations} established={institution.established} />
      <PartnerStrip
        items={data.universities.map((u) => ({ slug: u.slug, name: u.slug === "ncuk-university-partners" ? "NCUK" : u.name, logo: u.logo?.url ?? null, country: u.destination?.country ?? null }))}
      />

      {/* 2 — How it works */}
      <RouteJourney destinations={globeDestinations} counts={data.counts} />

      {/* 3 — Programmes */}
      <CinematicScene
        id="chapter-programmes"
        index={1}
        total={3}
        eyebrow="Our programmes"
        title="Your journey starts here."
        accent="Your future goes further."
        body="Discover international education pathways that connect students in Laos with opportunities at universities around the world."
        media={CINEMATIC.learning}
        cta={{ href: "/programmes", label: "Explore our programmes" }}
      />
      <ProgrammesAtAGlance programmes={data.programmes} />

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
      <ChooseYourRoute logos={data.universities.map((u) => ({ slug: u.slug, logo: u.logo?.url ?? null }))} />

      {/* Scholarships — a dedicated, image-led band */}
      <Scholarships />

      {/* 5 — Life at SHV */}
      <CinematicScene
        id="chapter-campus"
        index={3}
        total={3}
        eyebrow="A year in Vientiane"
        title="A year at home,"
        accent="lived fully."
        media={{ poster: "/media/students/Class_1.jpg", position: "50% 50%" }}
        pan
        cta={{ href: "/student-life", label: "Student life at SHV" }}
      />
      <LifeMosaic />

      {/* 6 — Alumni voices */}
      <AlumniVoices />

      {/* 7 — Trust */}
      <WhyStHughs institution={institution} limit={3} />

      {/* 8 — Work with us */}
      <WorkWithUs />

      {/* 8 — Start here */}
      <FinalCta />
    </>
  );
}
