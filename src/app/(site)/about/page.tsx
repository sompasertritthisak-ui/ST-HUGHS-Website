import type { Metadata } from "next";
import { getPageBySlug, getFaculty, getPartners, getContactSettings } from "@/lib/content";
import { getInstitutionSettings } from "@/lib/content-pages";
import { pageMetadata, educationalOrganizationJsonLd } from "@/lib/seo";
import { BlockRenderer } from "@/components/blocks";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { Section, FactsTable, Prose, PendingLine, SourceNote, NextSteps } from "@/components/pages";
import { Plate } from "@/components/ui/plate";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("about");
  return pageMetadata({
    title: page?.seoTitle ?? page?.title ?? "About",
    description: page?.seoDescription ?? "St Hugh's College Vientiane: a private college authorised by the Lao Ministry of Education and Sports and operating as an NCUK Study Centre.",
    path: "/about",
    noIndex: page?.noIndex,
  });
}

export default async function AboutPage() {
  const [page, leadership, partners, institution, contact] = await Promise.all([getPageBySlug("about"), getFaculty({ leadership: true }), getPartners(), getInstitutionSettings(), getContactSettings()]);
  // Blocks that are not the HERO are rendered after the institutional facts so the page reads: statement → facts → narrative.
  const heroBlocks = page?.blocks.filter((b) => b.type === "HERO") ?? [];
  const bodyBlocks = page?.blocks.filter((b) => b.type !== "HERO" && b.type !== "CTA") ?? [];
  const ctaBlocks = page?.blocks.filter((b) => b.type === "CTA") ?? [];

  return (
    <>
      {heroBlocks.length ? <BlockRenderer blocks={heroBlocks} fallbackTitle={page?.title ?? "About"} /> : <PageHero eyebrow="About SHV" title="St Hugh's College Vientiane" lede="A private college in Vientiane, authorised by the Lao Ministry of Education and Sports and operating as an NCUK Study Centre." />}

      <Section eyebrow="Institution" title="Authorisation and standing" lede="Trust is demonstrated: dates, authorisations and relationships, each with a source.">
        <FactsTable
          rows={[
            { label: "Established", value: institution.established ? String(institution.established) : null },
            { label: "Authorisation", value: institution.authorisation || null, pending: "Published as approved" },
            { label: "NCUK Study Centre", value: institution.ncukStudyCentre ? <Badge tone="success">Yes</Badge> : null, pending: "Published as approved" },
            { label: "NCUK partnership", value: institution.ncukSince || null, pending: "Published as approved" },
            { label: "Related institution", value: institution.sisterInstitution || null, pending: "Published as approved" },
            { label: "Campus", value: contact.addressLines.length ? contact.addressLines.join(", ") : null },
          ]}
        />
        <SourceNote note={institution.authorisationSource || null} className="mt-4" />
      </Section>

      {bodyBlocks.length ? <BlockRenderer blocks={bodyBlocks} fallbackTitle={page?.title ?? "About"} /> : null}

      <Section eyebrow="Vision and mission" title="What we are here to do" lede="Statements are maintained by SHV in the content management system.">
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Vision</p>
            <Prose text={institution.vision} pending="Published as approved." />
          </div>
          <div>
            <p className="eyebrow mb-3">Mission</p>
            <Prose text={institution.mission} pending="Published as approved." />
          </div>
        </div>
      </Section>

      <Section eyebrow="Leadership" title="The people responsible" lede="Names and roles from official sources. Biographies are published as approved." layout="full">
        {leadership.length ? (
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
            {leadership.map((person, i) => (
              <Reveal key={person.id} as="li" delay={i * 40} className="lg:col-span-4">
                <Plate media={person.photo} slot={`Portrait — ${person.name}`} aspect="3/4" sizes="(min-width:1024px) 30vw, 90vw" />
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-[1.125rem] font-medium text-fg">{person.name}</p>
                  <p className="mt-1 text-sm text-fg-muted">{person.role}</p>
                  {person.department ? <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{person.department}</p> : null}
                  {person.biography && !/to be supplied/i.test(person.biography) ? <p className="mt-3 text-sm leading-relaxed text-fg-muted">{person.biography}</p> : <PendingLine className="mt-3 text-sm">Biography published as approved</PendingLine>}
                </div>
              </Reveal>
            ))}
          </ul>
        ) : (
          <PendingLine>Leadership profiles are published as approved.</PendingLine>
        )}
      </Section>

      <Section eyebrow="Governance" title="How the college is run">
        <Prose text={institution.governanceNote} pending="Governance information is published as approved." />
      </Section>

      <Section eyebrow="Partners" title="Who we work with" lede="Awarding bodies and education partners with a published, sourced relationship to SHV.">
        {partners.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {partners.map((p) => (
              <li key={p.id} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
                <div className="sm:col-span-5">
                  {p.website ? (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" data-analytics="outbound_partner_click" className="text-[1.0625rem] font-medium text-fg hover:text-brand-soft">
                      {p.name} ↗
                    </a>
                  ) : (
                    <span className="text-[1.0625rem] font-medium text-fg">{p.name}</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-fg-muted sm:col-span-7">{p.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <PendingLine>Partners are published as approved.</PendingLine>
        )}
      </Section>

      <Section eyebrow="Explore" title="Where to next">
        <NextSteps
          items={[
            { label: "Why St Hugh's", description: "Why Laos, why SHV, why global — the evidence", href: "/why-st-hughs" },
            { label: "Programmes", description: "NCUK International Foundation Year and International Year One", href: "/programmes" },
            { label: "Campus", description: "The facilities in Nonsavanh Village", href: "/campus" },
            { label: "For partners", description: "The institutional credibility layer for universities and investors", href: "/for/partners" },
          ]}
        />
      </Section>

      <JsonLd data={educationalOrganizationJsonLd(contact, { established: institution.established, description: page?.seoDescription })} />
      {ctaBlocks.length ? <BlockRenderer blocks={ctaBlocks} fallbackTitle={page?.title ?? "About"} /> : <ConsultationBand title="Talk to us about the route ahead" body="Book a free consultation with an advisor." primaryHref="/consultation" primaryLabel="Book a consultation" secondaryHref="/programmes" secondaryLabel="Explore programmes" />}
    </>
  );
}
