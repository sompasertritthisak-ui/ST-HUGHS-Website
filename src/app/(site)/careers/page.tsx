import type { Metadata } from "next";
import { getOutcomeMetrics, getPathways, getStudentStories } from "@/lib/content";
import { getInstitutionSettings } from "@/lib/content-pages";
import { pageMetadata } from "@/lib/seo";
import { splitList } from "@/lib/utils";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { StoryCard } from "@/components/cards/story-card";
import { Section, Prose, NextSteps } from "@/components/pages";
import { Stat } from "@/components/ui/stat";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "Careers and employability",
  description: "From education to opportunity: verified outcomes, the career directions SHV pathways point toward, and the employability activity published as it is confirmed.",
  path: "/careers",
});

export default async function CareersPage() {
  const [metrics, pathways, stories, institution] = await Promise.all([getOutcomeMetrics(), getPathways(), getStudentStories({ take: 3 }), getInstitutionSettings()]);
  const directions = Array.from(new Set(pathways.flatMap((p) => splitList(p.careerDirections))));
  const fieldsByDirection = pathways.filter((p) => p.careerDirections);

  const pillars: { label: string; text: string }[] = [
    { label: "Internships", text: institution.internships },
    { label: "Employer connections", text: institution.employerConnections },
    { label: "Industry experience", text: institution.industryExperience },
    { label: "Professional skills", text: institution.professionalSkills },
    { label: "Career guidance", text: institution.careerGuidance },
    { label: "Networking", text: institution.networking },
    { label: "Practical learning", text: institution.practicalLearning },
  ];

  return (
    <>
      <PageHero
        eyebrow="Careers and employability"
        title={
          <>
            From education <span className="italic text-gold-soft">to opportunity.</span>
          </>
        }
        lede="The route does not end at a degree. This page shows what we can verify today about outcomes and employability, and is honest about what is still being confirmed."
      />

      <Section eyebrow="Outcomes" title="Verified outcomes" lede="Figures are published only once verified with a source and date. Empty tiles are structure waiting for evidence — not missing ambition." layout="full">
        {metrics.length ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <Reveal key={m.key} delay={i * 40}>
                <Stat label={m.label} value={m.value} unit={m.unit} sourceNote={m.sourceNote} verified={m.verificationStatus === "VERIFIED"} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Outcome metrics are published once verified" />
        )}
      </Section>

      <Section eyebrow="Career directions" title="Where the published routes point" lede="Drawn from the career directions attached to each published pathway. Directions, not guarantees.">
        {directions.length ? (
          <>
            <ul className="flex flex-wrap gap-3">
              {directions.map((d) => (
                <li key={d} className="inline-flex h-11 items-center rounded-[var(--radius-sm)] border border-line-strong px-4 text-[0.9375rem] text-fg">
                  {d}
                </li>
              ))}
            </ul>
            <ul className="mt-10 divide-y divide-line border-y border-line">
              {fieldsByDirection.map((p) => (
                <li key={p.id} className="grid gap-2 py-4 sm:grid-cols-12 sm:gap-6">
                  <Link href={`/pathways/${p.slug}`} className="text-[0.9375rem] font-medium text-fg hover:text-gold-soft sm:col-span-6">
                    {p.title}
                  </Link>
                  <p className="text-sm text-fg-muted sm:col-span-6">{p.careerDirections}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState title="Career directions are published with each confirmed pathway" />
        )}
      </Section>

      <Section eyebrow="Employability" title="How SHV prepares you for work" lede="Each area below is published as it is confirmed. Where nothing is written yet, nothing is claimed.">
        <dl className="divide-y divide-line border-y border-line">
          {pillars.map((p) => (
            <div key={p.label} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-gold-soft sm:col-span-4">{p.label}</dt>
              <dd className="sm:col-span-8">
                <Prose text={p.text} pending="Published as confirmed" className="text-[0.9375rem]" />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section eyebrow="Stories" title="Graduates and students" layout="full">
        {stories.length ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((s, i) => (
              <Reveal key={s.id} delay={i * 40}>
                <StoryCard story={s} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Outcome stories are published with consent and progression evidence" />
        )}
      </Section>

      <Section eyebrow="Employers" title="Working with SHV">
        <p className="max-w-[60ch] leading-relaxed text-fg-muted">Employers interested in internships, industry projects or graduate talent can contact the college directly. Partnerships are published here once agreed.</p>
        <NextSteps
          className="mt-8"
          items={[
            { label: "For employers", description: "How to work with SHV students and graduates", href: "/for/employers" },
            { label: "Enquire as an employer", description: "The admissions and partnerships team will respond", href: "/enquire?audience=EMPLOYER" },
            { label: "Pathways", description: "The routes and fields students are studying toward", href: "/pathways" },
          ]}
        />
      </Section>

      <ConsultationBand title="Plan the route to your career" body="Talk to an advisor about which programme and pathway lead toward the field you have in mind." primaryHref="/consultation" primaryLabel="Talk to an advisor" secondaryHref="/pathway-explorer" secondaryLabel="Explore your pathway" />
    </>
  );
}
