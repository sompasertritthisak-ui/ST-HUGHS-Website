import type { Metadata } from "next";
import { getFacilities, getContactSettings, getFaqs } from "@/lib/content";
import { pageMetadata, faqPageJsonLd } from "@/lib/seo";
import { FACILITY_CATEGORIES, FACILITY_CATEGORY_LABELS } from "@/lib/enums";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { Section, VerificationNote } from "@/components/pages";
import { Plate } from "@/components/ui/plate";
import { Reveal } from "@/components/ui/reveal";
import { Accordion } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";

export const metadata: Metadata = pageMetadata({
  title: "Campus",
  description: "The St Hugh's College Vientiane campus in Nonsavanh Village: classrooms, lecture halls, ICT room, library and grounds — only confirmed facilities, shown with real photography.",
  path: "/campus",
});

export default async function CampusPage() {
  const [facilities, contact, faqs] = await Promise.all([getFacilities(), getContactSettings(), getFaqs({ category: "CAMPUS" })]);
  const groups = FACILITY_CATEGORIES.map((c) => ({ category: c, items: facilities.filter((f) => f.category === c) })).filter((g) => g.items.length > 0);
  const anyPending = facilities.some((f) => f.verificationStatus !== "VERIFIED");

  return (
    <>
      <PageHero
        eyebrow="Campus"
        title={
          <>
            Where the route <span className="italic text-gold-soft">begins.</span>
          </>
        }
        lede="A walk through the campus in the order a visitor experiences it — arrival, learning spaces, study, social and outdoor. Only current, confirmed facilities are listed."
        aside={
          <div className="border-t border-line pt-6">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">Address</p>
            <address className="mt-2 not-italic leading-relaxed text-fg">
              {contact.addressLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            <div className="mt-6">
              <Button href="/consultation?type=visit" arrow="right">
                Book a visit
              </Button>
            </div>
          </div>
        }
      />

      {groups.length ? (
        groups.map((group, gi) => (
          <Section key={group.category} id={group.category.toLowerCase()} eyebrow={`${String(gi + 1).padStart(2, "0")} · ${FACILITY_CATEGORY_LABELS[group.category]}`} title={FACILITY_CATEGORY_LABELS[group.category]} layout="full">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-12">
              {group.items.map((f, i) => {
                const wide = group.items.length === 1 || i % 3 === 0;
                return (
                  <Reveal key={f.id} delay={i * 40} className={wide ? "lg:col-span-7" : "lg:col-span-5"}>
                    <Plate media={f.photo} slot={f.name} aspect={wide ? "3/2" : "4/3"} sizes="(min-width:1024px) 50vw, 100vw" />
                    <div className="mt-4 flex items-start justify-between gap-4 border-t border-line pt-3">
                      <div>
                        <h3 className="text-[1.0625rem] font-medium text-fg">{f.name}</h3>
                        {f.description ? <p className="mt-1 text-sm leading-relaxed text-fg-muted">{f.description}</p> : null}
                      </div>
                      {f.verificationStatus !== "VERIFIED" ? <VerificationBadge status={f.verificationStatus} className="shrink-0" /> : null}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Section>
        ))
      ) : (
        <section className="container-x py-16">
          <EmptyState title="Facilities are published as they are confirmed" />
        </section>
      )}

      {anyPending ? (
        <section className="container-x pb-6">
          <VerificationNote status="PENDING" />
        </section>
      ) : null}

      {faqs.length ? (
        <Section eyebrow="FAQ" title="Campus questions">
          <Accordion items={faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          <JsonLd data={faqPageJsonLd(faqs)} />
        </Section>
      ) : null}

      <ConsultationBand title="Walk the campus with an advisor" body="Book a visit to see the classrooms, lecture halls and study spaces in person, and ask anything about the year in Vientiane." primaryHref="/consultation?type=visit" primaryLabel="Book a visit" secondaryHref="/contact" secondaryLabel="Contact and directions" />
    </>
  );
}
