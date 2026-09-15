import type { Metadata } from "next";
import { getProgrammes, getMessagingSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PROGRAMME_TYPES, PROGRAMME_TYPE_LABELS, type ProgrammeType } from "@/lib/enums";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { ProgrammeJourney } from "@/components/sections/programme-journey";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { Section, PendingLine } from "@/components/pages";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "Programmes",
  description: "NCUK International Foundation Year, International Year One and bachelor pathways at St Hugh's College Vientiane — the programme is the first step of the route.",
  path: "/programmes",
});

const TYPE_INTROS: Partial<Record<ProgrammeType, string>> = {
  FOUNDATION: "Pre-university preparation completed in Vientiane before first-year entry abroad.",
  YEAR_ONE: "First-year undergraduate study in Vientiane, then direct entry to Year 2 with a partner university.",
  BACHELOR_PATHWAY: "Degree routes structured across Laos and a partner campus (for example 1+3 or 2+2).",
  LANGUAGE: "Language preparation that supports entry and progression.",
  SHORT_COURSE: "Short programmes confirmed per intake.",
};

export default async function ProgrammesPage() {
  const [programmes, messaging] = await Promise.all([getProgrammes(), getMessagingSettings()]);
  const groups = PROGRAMME_TYPES.map((type) => ({ type, items: programmes.filter((p) => p.type === type) })).filter((g) => g.items.length > 0 || g.type === "BACHELOR_PATHWAY");

  const stations = [
    { question: "Where are you now?", answer: "High school, a foundation year, A Levels or IB — the starting point decides which programme fits.", href: "/pathway-finder" },
    { question: "What do you want to study?", answer: "Subject routes are set per programme and per intake.", href: "#programmes" },
    { question: "Which programme fits?", answer: `${programmes.length} published programme${programmes.length === 1 ? "" : "s"}, grouped by type below.`, href: "#programmes" },
    { question: "Where can it lead?", answer: "Each programme links to the pathways and destinations it can progress to.", href: "/pathways" },
    { question: "Entry requirements", answer: "Published per programme; equivalencies for Lao and regional qualifications are confirmed in consultation.", href: "#programmes" },
    { question: "What will you study?", answer: "Module structure is listed on each programme page.", href: "#programmes" },
    { question: "How long?", answer: "Duration and intake dates are shown per programme.", href: "#programmes" },
    { question: "What happens after SHV?", answer: "Progression to partner universities, subject to the published requirements.", href: "/universities" },
    { question: "How do I apply?", answer: "Start with a free consultation; the admissions team guides each step.", href: "/admissions" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Programmes"
        title={
          <>
            The programme is the <span className="italic text-gold-soft">first step</span> of the route.
          </>
        }
        lede="We do not simply list programmes. Every programme at SHV is the Vientiane leg of a longer journey to a university abroad — so each page answers where you start, what you study, how long it takes and where it leads."
        aside={
          <dl className="grid grid-cols-2 gap-6 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
            <div>
              <dt className="text-fg-subtle">Published</dt>
              <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{programmes.length}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Study location</dt>
              <dd className="mt-2 normal-case tracking-normal text-fg">Vientiane, Lao PDR</dd>
            </div>
          </dl>
        }
      />

      <section aria-labelledby="journey-title" className="container-x pb-8">
        <h2 id="journey-title" className="sr-only">
          The student journey
        </h2>
        <ProgrammeJourney stations={stations} />
      </section>

      <div id="programmes" className="scroll-mt-24">
        {groups.map((group) => (
          <Section key={group.type} id={`type-${group.type.toLowerCase()}`} eyebrow={PROGRAMME_TYPE_LABELS[group.type]} title={PROGRAMME_TYPE_LABELS[group.type]} lede={TYPE_INTROS[group.type]} layout="full">
            {group.items.length ? (
              <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
                {group.items.map((p, i) => (
                  <Reveal key={p.id} delay={i * 40}>
                    <ProgrammeCard programme={p} index={i} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <PendingLine>Bachelor pathway structures are published here once confirmed with the partner university.</PendingLine>
            )}
          </Section>
        ))}
      </div>

      <section className="container-x py-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <p className="text-fg-muted lg:col-span-8">{messaging.guidanceDisclaimer}</p>
          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
            <Button href="/compare" variant="secondary">
              Compare your options
            </Button>
          </div>
        </div>
      </section>

      <ConsultationBand title="Not sure which programme fits?" body="Check your eligibility in a few steps, or talk to an advisor who will map your qualifications against each route." primaryHref="/pathway-finder" primaryLabel="Check your eligibility" secondaryHref="/consultation" secondaryLabel="Talk to an advisor" />
    </>
  );
}
