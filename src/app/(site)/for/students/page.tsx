import type { Metadata } from "next";
import { getProgrammes, getPathways, getFaqs, getMessagingSettings } from "@/lib/content";
import { pageMetadata, faqPageJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { PathwayCard } from "@/components/cards/pathway-card";
import { Section, StepRail, type RailStep } from "@/components/pages";
import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "For students",
  description: "You are in Laos and want a degree abroad. Here is how the route works, which programme fits, and the four next steps.",
  path: "/for/students",
});

export default async function ForStudentsPage() {
  const [programmes, pathways, faqs, messaging] = await Promise.all([getProgrammes(), getPathways({ featured: true }), getFaqs({ category: "PROGRAMMES" }), getMessagingSettings()]);
  const steps: RailStep[] = [
    { title: "Find the programme that fits where you are now", body: "Finished high school? The International Foundation Year. Completed a foundation year, A Levels or IB? The International Year One. Each page explains who it is for.", href: "/programmes", linkLabel: "Explore programmes" },
    { title: "Check your eligibility", body: <>The Pathway Finder gives guidance in a few steps. {messaging.guidanceDisclaimer}</>, href: "/pathway-finder", linkLabel: "Check your eligibility" },
    { title: "Trace the full route", body: "Programme → transfer point → partner → degree. See where each route leads and how long it takes.", href: "/pathway-explorer", linkLabel: "Explore your pathway" },
    { title: "Talk to an advisor", body: "A free consultation, in person or online. You leave with a written next-step plan.", href: "/consultation", linkLabel: "Book a free consultation" },
  ];

  return (
    <>
      <PageHero eyebrow="I'm a student" title={<>Start in Vientiane. <span className="italic text-gold-soft">Finish abroad.</span></>} lede="You want a degree from a university abroad and you are starting in Laos. SHV is the first year of that route: an internationally recognised programme completed close to home, then progression to a partner university." />

      <Section eyebrow="Your four steps" title="How to move from here" layout="full">
        <StepRail steps={steps} />
      </Section>

      <Section eyebrow="Programmes" title="Where you start" layout="full" aside={<Button href="/programmes" variant="ghost" arrow="right">All programmes</Button>}>
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
          {programmes.map((p, i) => (
            <Reveal key={p.id} delay={i * 40}>
              <ProgrammeCard programme={p} index={i} />
            </Reveal>
          ))}
        </div>
      </Section>

      {pathways.length ? (
        <Section eyebrow="Routes" title="Where it can lead" layout="full" aside={<Button href="/pathways" variant="ghost" arrow="right">All pathways</Button>}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pathways.map((p, i) => (
              <Reveal key={p.id} delay={i * 40}>
                <PathwayCard pathway={p} />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {faqs.length ? (
        <Section eyebrow="FAQ" title="Students ask">
          <Accordion items={faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          <JsonLd data={faqPageJsonLd(faqs)} />
        </Section>
      ) : null}

      <ConsultationBand title="Not sure where you fit?" body="Check your eligibility in a few steps, or talk to an advisor who will map your qualifications against each route." primaryHref="/pathway-finder" primaryLabel="Check your eligibility" secondaryHref="/consultation" secondaryLabel="Talk to an advisor" />
    </>
  );
}
