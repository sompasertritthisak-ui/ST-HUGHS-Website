import type { Metadata } from "next";
import { getPageBySlug, getPathways, getDestinations, getProgrammes } from "@/lib/content";
import { getInstitutionSettings } from "@/lib/content-pages";
import { pageMetadata } from "@/lib/seo";
import { BlockRenderer } from "@/components/blocks";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { PathwayTimeline } from "@/components/sections/pathway-timeline";
import { Section, FactsTable, NextSteps } from "@/components/pages";
import { Node } from "@/components/ui/node";
import { Reveal } from "@/components/ui/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("why-st-hughs");
  return pageMetadata({
    title: page?.seoTitle ?? page?.title ?? "Why St Hugh's",
    description: page?.seoDescription ?? "Why students and families choose St Hugh's College Vientiane: a local start, international programmes and a route to universities worldwide.",
    path: "/why-st-hughs",
    noIndex: page?.noIndex,
  });
}

export default async function WhyPage() {
  const [page, pathways, destinations, programmes, institution] = await Promise.all([getPageBySlug("why-st-hughs"), getPathways({ featured: true }), getDestinations(), getProgrammes(), getInstitutionSettings()]);
  const heroBlocks = page?.blocks.filter((b) => b.type === "HERO") ?? [];
  const otherBlocks = page?.blocks.filter((b) => b.type !== "HERO" && b.type !== "CTA") ?? [];
  const ctaBlocks = page?.blocks.filter((b) => b.type === "CTA") ?? [];
  const exemplar = pathways[0];
  const verifiedDestinations = destinations.filter((d) => d.verificationStatus === "VERIFIED");

  const acts = [
    { code: "Act I", title: "Why Laos", body: "Start close to home. The first year is completed in Vientiane — family proximity, a lower relocation barrier and time to build academic English before moving abroad." },
    { code: "Act II", title: "Why SHV", body: "International programmes quality-assured by an awarding body, an institution authorised by the Lao Ministry of Education and Sports, and pathway guidance from the first conversation." },
    { code: "Act III", title: "Why global", body: `Published routes currently lead to ${verifiedDestinations.length} verified destination${verifiedDestinations.length === 1 ? "" : "s"}, with further partner routes published as they are confirmed.` },
  ];

  return (
    <>
      {heroBlocks.length ? <BlockRenderer blocks={heroBlocks} fallbackTitle={page?.title ?? "Why St Hugh's"} /> : <PageHero eyebrow="Why St Hugh's" title="Why Laos. Why SHV. Why global." lede="Evidence, not adjectives." />}

      <section aria-label="Three acts" className="container-x pb-4">
        <ol className="grid gap-8 lg:grid-cols-3">
          {acts.map((act, i) => (
            <Reveal key={act.title} as="li" delay={i * 40} className="relative border-t border-line pt-6">
              <Node active={i === 0} className="absolute -top-3 left-0" />
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-brand-soft">{act.code}</span>
              <h2 className="font-display mt-3 text-[clamp(1.75rem,2.6vw,2.25rem)] text-fg">{act.title}</h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-fg-muted">{act.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {otherBlocks.length ? <BlockRenderer blocks={otherBlocks} fallbackTitle={page?.title ?? "Why St Hugh's"} /> : null}

      <Section eyebrow="Evidence" title="The facts behind the claims" lede="Each line is sourced from an official record or the published catalogue.">
        <FactsTable
          rows={[
            { label: "Authorisation", value: institution.authorisation || null, pending: "Published as approved" },
            { label: "Awarding body partnership", value: institution.ncukSince || null, pending: "Published as approved" },
            { label: "Published programmes", value: programmes.length ? programmes.map((p) => p.shortTitle ?? p.title).join(" · ") : null },
            { label: "Verified destinations", value: verifiedDestinations.length ? verifiedDestinations.map((d) => d.country).join(", ") : null, pending: "Published as routes are verified" },
          ]}
        />
      </Section>

      {exemplar ? (
        <Section eyebrow="An example route" title={exemplar.title} lede={exemplar.summary} layout="full">
          <PathwayTimeline steps={exemplar.steps} orientation="horizontal" />
        </Section>
      ) : null}

      <Section eyebrow="Go deeper" title="Look at the evidence yourself">
        <NextSteps
          items={[
            { label: "About SHV", description: "Authorisation, leadership and partners", href: "/about" },
            { label: "Universities", description: "The network and named institutions, with verification status", href: "/universities" },
            { label: "Student stories", description: "Published with consent, never invented", href: "/student-stories" },
            { label: "Careers and employability", description: "Verified outcomes and what is still being confirmed", href: "/careers" },
          ]}
        />
      </Section>

      {ctaBlocks.length ? <BlockRenderer blocks={ctaBlocks} fallbackTitle={page?.title ?? "Why St Hugh's"} /> : <ConsultationBand title="See where your route could lead" primaryHref="/pathway-explorer" primaryLabel="Explore your pathway" secondaryHref="/consultation" secondaryLabel="Talk to an advisor" />}
    </>
  );
}
