import type { Metadata } from "next";
import { getFaculty, getPartners, getFaqs, getContactSettings } from "@/lib/content";
import { getInstitutionSettings } from "@/lib/content-pages";
import { pageMetadata, faqPageJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { Section, FactsTable, Prose, PendingLine, NextSteps, SourceNote } from "@/components/pages";
import { Plate } from "@/components/ui/plate";
import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = pageMetadata({
  title: "For parents",
  description: "What parents and guardians need to know about St Hugh's College Vientiane: authorisation, the NCUK partnership, leadership, safeguards and the free consultation.",
  path: "/for/parents",
});

export default async function ForParentsPage() {
  const [leadership, partners, faqs, feeFaqs, contact, institution] = await Promise.all([getFaculty({ leadership: true }), getPartners(), getFaqs({ category: "PROGRESSION" }), getFaqs({ category: "FEES" }), getContactSettings(), getInstitutionSettings()]);
  const allFaqs = [...faqs, ...feeFaqs];
  const ncuk = partners.find((p) => p.type === "AWARDING_BODY");

  return (
    <>
      <PageHero eyebrow="I'm a parent" title={<>Reasons to <span className="italic text-gold-soft">trust</span>, not adjectives.</>} lede="You are weighing whether a degree abroad is realistic and whether this college is serious. This page sets out what can be verified today — authorisation, the awarding body, the people responsible — and what the first conversation costs: nothing." />

      <Section eyebrow="Trust signals" title="What is on record" lede="Each line is sourced. Where SHV has not yet published something, the line says so.">
        <FactsTable
          columns={1}
          rows={[
            { label: "Authorisation", value: institution.authorisation || null, pending: "Published as approved" },
            { label: "Awarding body", value: ncuk ? <><span className="text-fg">{ncuk.name}</span> — {ncuk.description}</> : null, pending: "Published as approved" },
            { label: "NCUK partnership", value: institution.ncukSince || null, pending: "Published as approved" },
            { label: "Related institution", value: institution.sisterInstitution || null, pending: "Published as approved" },
            { label: "Campus address", value: contact.addressLines.join(", ") || null },
            { label: "Consultation fee", value: <Badge tone="success">Free</Badge> },
          ]}
        />
        <SourceNote note={institution.authorisationSource || null} className="mt-4" />
      </Section>

      <Section eyebrow="Leadership" title="Who is responsible" lede="Names and roles from official sources; biographies published as approved." layout="full">
        {leadership.length ? (
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
            {leadership.map((person, i) => (
              <Reveal key={person.id} as="li" delay={i * 40} className="lg:col-span-4">
                <Plate media={person.photo} slot={`Portrait — ${person.name}`} aspect="3/4" sizes="(min-width:1024px) 30vw, 90vw" />
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-[1.125rem] font-medium text-fg">{person.name}</p>
                  <p className="mt-1 text-sm text-fg-muted">{person.role}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        ) : (
          <PendingLine>Leadership profiles are published as approved.</PendingLine>
        )}
      </Section>

      <Section eyebrow="Safeguards" title="How students are looked after" lede="Published as approved by SHV.">
        <Prose text={institution.safeguardingNote} pending="Safeguarding and student welfare information is published as approved. Ask about it directly in a consultation." />
      </Section>

      <Section eyebrow="How progression works" title="What 'guaranteed' actually means" lede="The most important thing to understand before choosing a route.">
        {allFaqs.length ? (
          <>
            <Accordion items={allFaqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
            <JsonLd data={faqPageJsonLd(allFaqs)} />
          </>
        ) : (
          <PendingLine>Published as approved.</PendingLine>
        )}
      </Section>

      <Section eyebrow="Next steps" title="What to do with an afternoon">
        <NextSteps
          items={[
            { label: "Book a free consultation", description: "Come together with your child; an advisor explains the route, the requirements and the costs for the intake", href: "/consultation" },
            { label: "Visit the campus", description: "See the classrooms, lecture halls and study spaces", href: "/consultation?type=visit" },
            { label: "Read about the institution", description: "Authorisation, partners and leadership", href: "/about" },
            { label: "See the routes", description: "Where the programmes lead and what each step requires", href: "/pathways" },
          ]}
        />
      </Section>

      <ConsultationBand title="Bring your questions" body="A free consultation with an advisor — together with your child — covering the route, the requirements and the costs for the intake." primaryHref="/consultation" primaryLabel="Book a free consultation" secondaryHref="/faqs" secondaryLabel="Read the FAQs" />
    </>
  );
}
