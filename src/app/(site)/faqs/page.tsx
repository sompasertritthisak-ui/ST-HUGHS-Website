import type { Metadata } from "next";
import Link from "next/link";
import { getFaqs } from "@/lib/content";
import { pageMetadata, faqPageJsonLd } from "@/lib/seo";
import { FAQ_CATEGORIES, FAQ_CATEGORY_LABELS } from "@/lib/enums";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { Section } from "@/components/pages";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = pageMetadata({
  title: "Frequently asked questions",
  description: "Answers about admissions, programmes, pathways, English requirements, fees, campus and university progression at St Hugh's College Vientiane.",
  path: "/faqs",
});

export default async function FaqsPage() {
  const faqs = await getFaqs();
  const groups = FAQ_CATEGORIES.map((c) => ({ category: c, items: faqs.filter((f) => f.category === c) })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title={<>Straight <span className="italic text-gold-soft">answers.</span></>}
        lede="Grouped by topic. If a question is not answered here, an advisor will answer it in a free consultation."
        aside={
          groups.length ? (
            <nav aria-label="FAQ categories" className="border-t border-line pt-6">
              <p className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">Jump to</p>
              <ul className="grid gap-1.5">
                {groups.map((g) => (
                  <li key={g.category}>
                    <Link href={`#${g.category.toLowerCase()}`} className="group flex items-center justify-between py-1 text-[0.9375rem] text-fg-muted hover:text-fg">
                      {FAQ_CATEGORY_LABELS[g.category]}
                      <span className="font-mono text-[0.6875rem] tabular text-fg-subtle">{g.items.length}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null
        }
      />

      {groups.length ? (
        groups.map((g) => (
          <Section key={g.category} id={g.category.toLowerCase()} eyebrow="Topic" title={FAQ_CATEGORY_LABELS[g.category]}>
            <Accordion items={g.items.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          </Section>
        ))
      ) : (
        <section className="container-x py-16">
          <EmptyState title="Questions and answers are published as approved" />
        </section>
      )}

      {faqs.length ? <JsonLd data={faqPageJsonLd(faqs)} /> : null}

      <ConsultationBand title="Still have a question?" body="Book a free consultation or send an enquiry — the admissions team answers directly." primaryHref="/consultation" primaryLabel="Book a free consultation" secondaryHref="/enquire" secondaryLabel="Send an enquiry" />
    </>
  );
}
