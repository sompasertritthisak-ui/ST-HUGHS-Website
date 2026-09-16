import type { Metadata } from "next";
import { getPathways, getProgrammes, getOutcomeMetrics } from "@/lib/content";
import { getInstitutionSettings } from "@/lib/content-pages";
import { pageMetadata } from "@/lib/seo";
import { splitList } from "@/lib/utils";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { Section, Prose, NextSteps, FactsTable } from "@/components/pages";
import { Stat } from "@/components/ui/stat";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "For employers",
  description: "Internships, industry links and graduate talent from St Hugh's College Vientiane — what students study toward, what is verified, and how to work with the college.",
  path: "/for/employers",
});

export default async function ForEmployersPage() {
  const [pathways, programmes, metrics, institution] = await Promise.all([getPathways(), getProgrammes(), getOutcomeMetrics(), getInstitutionSettings()]);
  const fields = Array.from(new Set(pathways.flatMap((p) => splitList(p.field ?? p.subjectArea))));
  const relevant = metrics.filter((m) => ["internships", "employment"].includes(m.key));

  return (
    <>
      <PageHero
        eyebrow="I'm an employer"
        title={<>Talent with a <span className="italic text-brand-soft">route.</span></>}
        lede="SHV students begin international degrees in Vientiane and progress to partner universities abroad. Employers can shape that journey — internships, industry projects and mentoring — and meet graduates who return with international qualifications."
        aside={
          <div className="border-t border-line pt-6">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">Work with SHV</p>
            <div className="mt-5">
              <Button href="/enquire?audience=EMPLOYER" arrow="right">
                Employer enquiry
              </Button>
            </div>
          </div>
        }
      />

      <Section eyebrow="What students study toward" title="Fields and programmes">
        <FactsTable
          columns={1}
          rows={[
            { label: "Programmes in Vientiane", value: programmes.length ? programmes.map((p) => p.shortTitle ?? p.title).join(" · ") : null },
            { label: "Fields on published routes", value: fields.length ? fields.join(" · ") : null, pending: "Published as routes are confirmed" },
          ]}
        />
      </Section>

      <Section eyebrow="Verified" title="Internships and employment" lede="Figures are published only once verified. Empty tiles are structure awaiting evidence." layout="full">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {relevant.map((m, i) => (
            <Reveal key={m.key} delay={i * 40}>
              <Stat label={m.label} value={m.value} unit={m.unit} sourceNote={m.sourceNote} verified={m.verificationStatus === "VERIFIED"} />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="Ways to work together" title="Internships, projects, mentoring" lede="Each area is published as confirmed with the college.">
        <dl className="divide-y divide-line border-y border-line">
          {[
            { label: "Internships", text: institution.internships },
            { label: "Employer connections", text: institution.employerConnections },
            { label: "Industry experience", text: institution.industryExperience },
            { label: "Networking", text: institution.networking },
          ].map((row) => (
            <div key={row.label} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft sm:col-span-4">{row.label}</dt>
              <dd className="sm:col-span-8">
                <Prose text={row.text} pending="Published as confirmed" className="text-[0.9375rem]" />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section eyebrow="Next steps" title="Start the conversation">
        <NextSteps
          items={[
            { label: "Employer enquiry", description: "Internships, projects, mentoring or recruitment", href: "/enquire?audience=EMPLOYER" },
            { label: "Careers and employability", description: "Outcomes and career directions on the published routes", href: "/careers" },
            { label: "Pathways", description: "The routes and fields students are studying toward", href: "/pathways" },
          ]}
        />
      </Section>

      <ConsultationBand title="Interested in SHV talent?" body="Send an employer enquiry and the college will respond directly." primaryHref="/enquire?audience=EMPLOYER" primaryLabel="Employer enquiry" secondaryHref="/careers" secondaryLabel="Careers and employability" />
    </>
  );
}
