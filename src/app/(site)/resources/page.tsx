import type { Metadata } from "next";
import { getDocuments } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/enums";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { Section, NextSteps } from "@/components/pages";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const metadata: Metadata = pageMetadata({
  title: "Resources",
  description: "Prospectus, programme brochures, entry requirements, application guides, handbooks and calendars from St Hugh's College Vientiane — published as approved.",
  path: "/resources",
});

export default async function ResourcesPage() {
  const documents = await getDocuments();
  const groups = DOCUMENT_CATEGORIES.map((c) => ({ category: c, items: documents.filter((d) => d.category === c) })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHero
        eyebrow="Resource centre"
        title={<>Documents, <span className="italic text-gold-soft">as approved.</span></>}
        lede="Prospectus, brochures, entry requirements, application guides, handbooks and calendars. Every document carries a version and a date, and appears here only once approved."
        aside={
          <dl className="grid grid-cols-2 gap-6 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
            <div>
              <dt className="text-fg-subtle">Published documents</dt>
              <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{documents.length}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Categories</dt>
              <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{groups.length}</dd>
            </div>
          </dl>
        }
      />

      {groups.length ? (
        groups.map((g) => (
          <Section key={g.category} id={g.category.toLowerCase()} eyebrow="Category" title={DOCUMENT_CATEGORY_LABELS[g.category]}>
            <ul className="divide-y divide-line border-y border-line">
              {g.items.map((d) => (
                <li key={d.id} className="grid gap-3 py-5 sm:grid-cols-12 sm:items-center sm:gap-6">
                  <div className="sm:col-span-7">
                    <p className="text-[1.0625rem] font-medium text-fg">{d.title}</p>
                    {d.description ? <p className="mt-1 text-sm leading-relaxed text-fg-muted">{d.description}</p> : null}
                  </div>
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle sm:col-span-3">
                    v{d.version}
                    {d.documentDate ? ` · ${formatDate(d.documentDate)}` : ""}
                  </p>
                  <div className="sm:col-span-2 sm:text-right">
                    {d.media?.url ? (
                      <a href={d.media.url} target="_blank" rel="noopener noreferrer" data-analytics="brochure_download" className="inline-flex items-center gap-2 text-sm text-gold-soft underline underline-offset-4">
                        <Download aria-hidden className="size-4" strokeWidth={1.5} />
                        Download
                      </a>
                    ) : (
                      <span className="text-sm text-fg-subtle">File pending</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        ))
      ) : (
        <section className="container-x py-16">
          <EmptyState title="Documents are published here as they are approved" body="Prospectus, brochures, entry requirements and guides appear once the admissions team approves them. In the meantime the programme pages carry the published requirements." action={<Button href="/programmes" variant="secondary">View programmes</Button>} />
        </section>
      )}

      <Section eyebrow="Also useful" title="Published elsewhere on the site">
        <NextSteps
          items={[
            { label: "Entry requirements by programme", description: "Academic and English requirements on each programme page", href: "/programmes" },
            { label: "FAQs", description: "Admissions, programmes, pathways, fees and more", href: "/faqs" },
            { label: "International students", description: "Official sources and practical information", href: "/international-students" },
          ]}
        />
      </Section>

      <ConsultationBand title="Need a document that is not here yet?" body="The admissions team can send current information for your intake and confirm fees and dates directly." primaryHref="/enquire?type=BROCHURE" primaryLabel="Request information" secondaryHref="/consultation" secondaryLabel="Book a consultation" />
    </>
  );
}
