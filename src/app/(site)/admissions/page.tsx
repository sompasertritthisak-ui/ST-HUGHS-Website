import type { Metadata } from "next";
import Link from "next/link";
import { getProgrammes, getFaqs, getMessagingSettings, getDocuments } from "@/lib/content";
import { pageMetadata, faqPageJsonLd } from "@/lib/seo";
import { parseStringArray } from "@/lib/utils";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { Section, StepRail, FactsTable, type RailStep } from "@/components/pages";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "Admissions",
  description: "How to apply to St Hugh's College Vientiane, step by step: explore, check eligibility, choose a pathway, talk to an advisor, apply, prepare and start.",
  path: "/admissions",
});

export default async function AdmissionsPage() {
  const [programmes, faqs, applicationFaqs, messaging, documents] = await Promise.all([getProgrammes(), getFaqs({ category: "ADMISSIONS" }), getFaqs({ category: "APPLICATIONS" }), getMessagingSettings(), getDocuments({ category: "APPLICATION" })]);
  const allFaqs = [...faqs, ...applicationFaqs];
  const intakes = Array.from(new Set(programmes.flatMap((p) => parseStringArray(p.intakesJson))));

  const steps: RailStep[] = [
    { title: "Explore", body: "Understand the programmes and where each can lead. Every programme page answers where you start, what you study and how long it takes.", href: "/programmes", linkLabel: "Explore programmes" },
    { title: "Check eligibility", body: <>Use the Pathway Finder to see which routes your current qualification and English level point toward. {messaging.guidanceDisclaimer}</>, href: "/pathway-finder", linkLabel: "Check your eligibility" },
    { title: "Choose a pathway", body: "Trace the full route — programme, transfer point, partner, degree — and compare options side by side.", href: "/pathway-explorer", linkLabel: "Open the Pathway Explorer" },
    { title: "Talk to an advisor", body: "Book a free consultation. An advisor checks your documents against the entry requirements and gives you a written next-step plan. There is no consultation fee.", href: "/consultation", linkLabel: "Book a free consultation" },
    { title: "Apply", body: "The admissions team guides your application and confirms the documents required for your route. Start with an enquiry and we will send the application steps.", href: "/enquire", linkLabel: "Start your application enquiry" },
    { title: "Prepare", body: "Collect published guides and, for international students, official visa sources. Fees and timetables for your intake are confirmed by the admissions team.", href: "/resources", linkLabel: "Resource centre" },
    { title: "Start", body: intakes.length ? `Published intake${intakes.length === 1 ? "" : "s"}: ${intakes.join(", ")}. Exact dates for each programme are confirmed by the admissions team.` : "Intake dates are confirmed by the admissions team and shown on each programme page.", href: "/programmes", linkLabel: "See intakes by programme" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title={
          <>
            Seven steps, <span className="italic text-brand-soft">one advisor.</span>
          </>
        }
        lede="Admissions at SHV is a guided journey rather than a form. The steps below are the real sequence, and each one links to the tool or person that helps you complete it."
        aside={
          <div className="border-t border-line pt-6">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">Fastest route</p>
            <p className="mt-2 text-fg">Book a free consultation and let an advisor walk you through the rest.</p>
            <div className="mt-5">
              <Button href="/consultation" arrow="right">
                Book a free consultation
              </Button>
            </div>
          </div>
        }
      />

      <Section eyebrow="The journey" title="Explore → Check → Choose → Talk → Apply → Prepare → Start" layout="full">
        <StepRail steps={steps} />
      </Section>

      <Section eyebrow="Entry requirements" title="What each programme asks for" lede="Summarised from the published programme records. Equivalencies for Lao and regional qualifications are confirmed in consultation." layout="full">
        <div className="grid gap-10 lg:grid-cols-2">
          {programmes.map((p) => (
            <div key={p.id}>
              <Link href={`/programmes/${p.slug}`} className="font-display text-[1.75rem] leading-tight text-fg hover:text-brand-soft">
                {p.shortTitle ?? p.title}
              </Link>
              <FactsTable
                className="mt-4"
                columns={1}
                rows={[
                  { label: "Academic", value: p.entryRequirements },
                  { label: "English", value: p.englishRequirement, pending: "Confirmed per intake" },
                  { label: "Intakes", value: parseStringArray(p.intakesJson).join(", ") || null },
                ]}
              />
            </div>
          ))}
        </div>
      </Section>

      {documents.length ? (
        <Section eyebrow="Documents" title="Application documents">
          <ul className="divide-y divide-line border-y border-line">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-6 py-4">
                <div>
                  <p className="text-[1rem] font-medium text-fg">{d.title}</p>
                  {d.description ? <p className="mt-1 text-sm text-fg-muted">{d.description}</p> : null}
                </div>
                {d.media?.url ? (
                  <a href={d.media.url} target="_blank" rel="noopener noreferrer" data-analytics="brochure_download" className="shrink-0 text-sm text-brand-soft underline underline-offset-4">
                    Download
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {allFaqs.length ? (
        <Section eyebrow="FAQ" title="Admissions questions">
          <Accordion items={allFaqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          <JsonLd data={faqPageJsonLd(allFaqs)} />
        </Section>
      ) : null}

      <ConsultationBand title="Ready for step four?" body="Book a free consultation. An advisor checks your qualifications against the entry requirements and gives you a clear next-step plan." primaryHref="/consultation" primaryLabel="Book a free consultation" secondaryHref="/pathway-finder" secondaryLabel="Check your eligibility first" />
    </>
  );
}
