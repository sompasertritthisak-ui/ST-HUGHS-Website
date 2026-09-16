import type { Metadata } from "next";
import { getProgrammes, getDestinations, getFacilities, getFaqs, getContactSettings } from "@/lib/content";
import { getInstitutionSettings } from "@/lib/content-pages";
import { pageMetadata, faqPageJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { Section, Prose, PendingLine, NextSteps, FactsTable } from "@/components/pages";
import { Reveal } from "@/components/ui/reveal";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "International students",
  description: "Studying at St Hugh's College Vientiane from outside Laos: programmes, campus, admissions, official visa sources, accommodation and support — published as confirmed.",
  path: "/international-students",
});

export default async function InternationalStudentsPage() {
  const [programmes, destinations, facilities, faqs, contact, institution] = await Promise.all([getProgrammes(), getDestinations(), getFacilities(), getFaqs({ category: "INTERNATIONAL" }), getContactSettings(), getInstitutionSettings()]);
  const visaLink = institution.visaOfficialLink?.trim();

  return (
    <>
      <PageHero
        eyebrow="International students"
        title={
          <>
            Vientiane as a <span className="italic text-brand-soft">starting point.</span>
          </>
        }
        lede="A dedicated journey for students joining SHV from outside Laos. Where official information exists we publish it; where it does not, we say so and point you to the people who can confirm it."
        aside={
          <div className="border-t border-line pt-6">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">Campus</p>
            <address className="mt-2 not-italic leading-relaxed text-fg">{contact.addressLines.join(", ")}</address>
            <div className="mt-5">
              <Button href="/consultation" arrow="right">
                Talk to an advisor
              </Button>
            </div>
          </div>
        }
      />

      <Section id="why-vientiane" eyebrow="Why Vientiane" title="A calm capital to begin in" lede="The first year of the route is completed here before progression abroad.">
        <FactsTable
          columns={1}
          rows={[
            { label: "Where", value: contact.addressLines.length ? contact.addressLines.join(", ") : null },
            { label: "Campus facilities", value: facilities.length ? facilities.map((f) => f.name).join(", ") : null, pending: "Published as confirmed" },
            { label: "Living in Laos", value: institution.livingInLaos || null, pending: "Confirmed by the admissions team" },
          ]}
        />
      </Section>

      <Section id="programmes" eyebrow="Programmes" title="What you can study here" layout="full" aside={<Button href="/programmes" variant="ghost" arrow="right">All programmes</Button>}>
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
          {programmes.map((p, i) => (
            <Reveal key={p.id} delay={i * 40}>
              <ProgrammeCard programme={p} index={i} />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="admissions" eyebrow="Admissions" title="How to apply from abroad" lede="The same seven-step journey applies. An advisor confirms document equivalencies for your country in the consultation.">
        <NextSteps
          items={[
            { label: "The admissions journey", description: "Explore → Check → Choose → Talk → Apply → Prepare → Start", href: "/admissions" },
            { label: "Check your eligibility", description: "Guidance based on your current qualification and English level", href: "/pathway-finder" },
            { label: "Book a free consultation", description: "Online, by phone or in person", href: "/consultation" },
          ]}
        />
      </Section>

      <Section id="visa" eyebrow="Visa information" title="Official sources only" lede="Visa and residence requirements are set by the Lao authorities. We link to official sources and do not give immigration advice.">
        {visaLink ? (
          <p className="text-[1.0625rem] leading-relaxed text-fg-muted">
            Official source:{" "}
            <a href={visaLink} target="_blank" rel="noopener noreferrer" className="text-brand-soft underline underline-offset-4">
              {visaLink.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
            </a>
          </p>
        ) : (
          <PendingLine>The official visa information link is published here once confirmed by the admissions team.</PendingLine>
        )}
        <div className="mt-4">
          <Prose text={institution.visaNote} pending="The admissions team can explain the process and the documents typically requested; the authorities make the decision." />
        </div>
      </Section>

      <Section id="living" eyebrow="Accommodation, support and costs" title="Practical matters" lede="Each item is published as confirmed. Nothing here is estimated.">
        <dl className="divide-y divide-line border-y border-line">
          {[
            { label: "Accommodation", text: institution.accommodation },
            { label: "Student support", text: institution.studentSupport },
            { label: "Costs", text: institution.costs },
          ].map((row) => (
            <div key={row.label} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft sm:col-span-4">{row.label}</dt>
              <dd className="sm:col-span-8">
                <Prose text={row.text} className="text-[0.9375rem]" />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="progression" eyebrow="International progression" title="Where the routes lead" lede="Only destinations with a published or pending route from SHV are listed.">
        <ul className="flex flex-wrap gap-3">
          {destinations.map((d) => (
            <li key={d.id}>
              <Link href={`/destinations/${d.slug}`} className="inline-flex h-11 items-center gap-3 rounded-[var(--radius-sm)] border border-line-strong px-4 text-[0.9375rem] text-fg transition-colors hover:border-route hover:text-brand-soft">
                <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-brand-soft">{d.isoCode}</span>
                {d.country}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {faqs.length ? (
        <Section eyebrow="FAQ" title="International student questions">
          <Accordion items={faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          <JsonLd data={faqPageJsonLd(faqs)} />
        </Section>
      ) : null}

      <ConsultationBand title="Joining from outside Laos?" body="Book a free online consultation. An advisor will confirm document equivalencies for your country and explain the steps." primaryHref="/consultation" primaryLabel="Book an online consultation" secondaryHref="/enquire" secondaryLabel="Send an enquiry" />
    </>
  );
}
