import type { Metadata } from "next";
import { getFaculty, getPartners, getProgrammes, getContactSettings } from "@/lib/content";
import { getInstitutionSettings } from "@/lib/content-pages";
import { pageMetadata, educationalOrganizationJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { Section, FactsTable, Prose, PendingLine, NextSteps, SourceNote } from "@/components/pages";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "For partners",
  description: "Institutional information for universities, education partners and investors: authorisation, governance, leadership, academic model and how to open a conversation with St Hugh's College Vientiane.",
  path: "/for/partners",
});

export default async function ForPartnersPage() {
  const [leadership, partners, programmes, contact, institution] = await Promise.all([getFaculty({ leadership: true }), getPartners(), getProgrammes(), getContactSettings(), getInstitutionSettings()]);

  return (
    <>
      <PageHero
        eyebrow="I'm a partner"
        title={<>Is this institution <span className="italic text-brand-soft">serious?</span></>}
        lede="A short, factual layer for universities, education partners and investors. Everything here is on record or clearly marked as not yet published; nothing is decorated."
        aside={
          <div className="border-t border-line pt-6">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">Partnerships</p>
            <p className="mt-2 text-fg">Open a conversation with the college directly.</p>
            <div className="mt-5">
              <Button href="/enquire?audience=PARTNER" arrow="right">
                Partner enquiry
              </Button>
            </div>
          </div>
        }
      />

      <Section eyebrow="Institution" title="On record">
        <FactsTable
          columns={1}
          rows={[
            { label: "Established", value: institution.established ? String(institution.established) : null },
            { label: "Authorisation", value: institution.authorisation || null, pending: "Published as approved" },
            { label: "Awarding body partnership", value: institution.ncukSince || null, pending: "Published as approved" },
            { label: "Related institution", value: institution.sisterInstitution || null, pending: "Published as approved" },
            { label: "Programmes delivered", value: programmes.length ? programmes.map((p) => p.title).join("; ") : null },
            { label: "Campus", value: contact.addressLines.join(", ") || null },
          ]}
        />
        <SourceNote note={institution.authorisationSource || null} className="mt-4" />
      </Section>

      <Section eyebrow="Vision, mission, history" title="Purpose and direction" lede="Maintained by SHV in the content management system and published as approved.">
        <dl className="divide-y divide-line border-y border-line">
          {[
            { label: "Vision", text: institution.vision },
            { label: "Mission", text: institution.mission },
            { label: "History", text: institution.history },
            { label: "Academic model", text: institution.academicModel },
            { label: "Future direction", text: institution.futureDirection },
          ].map((row) => (
            <div key={row.label} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft sm:col-span-4">{row.label}</dt>
              <dd className="sm:col-span-8">
                <Prose text={row.text} pending="Published as approved" className="text-[0.9375rem]" />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section eyebrow="Governance and leadership" title="Who is accountable">
        <Prose text={institution.governanceNote} pending="Governance information is published as approved." />
        {leadership.length ? (
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {leadership.map((p) => (
              <li key={p.id} className="grid gap-1 py-4 sm:grid-cols-12 sm:gap-6">
                <span className="text-[1.0625rem] font-medium text-fg sm:col-span-5">{p.name}</span>
                <span className="text-sm text-fg-muted sm:col-span-7">{p.role}</span>
              </li>
            ))}
          </ul>
        ) : (
          <PendingLine className="mt-6">Leadership profiles are published as approved.</PendingLine>
        )}
      </Section>

      <Section eyebrow="Existing relationships" title="Partnerships on record">
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
          <PendingLine>Partnerships are published as approved.</PendingLine>
        )}
      </Section>

      <Section eyebrow="Next steps" title="Open a conversation">
        <NextSteps
          items={[
            { label: "Partner enquiry", description: "Universities, articulation, education and industry partnerships", href: "/enquire?audience=PARTNER" },
            { label: "Universities and network", description: "How current routes are structured and verified", href: "/universities" },
            { label: "Programmes", description: "What is delivered in Vientiane and to which level", href: "/programmes" },
          ]}
        />
      </Section>

      <JsonLd data={educationalOrganizationJsonLd(contact, { established: institution.established })} />
      <ConsultationBand title="Exploring a partnership?" body="Send a partner enquiry and the college leadership will respond directly." primaryHref="/enquire?audience=PARTNER" primaryLabel="Partner enquiry" secondaryHref="/about" secondaryLabel="About the institution" />
    </>
  );
}
