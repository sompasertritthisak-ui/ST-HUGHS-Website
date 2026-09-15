import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPathwayBySlug, getMessagingSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { splitList } from "@/lib/utils";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { PathwayTimeline } from "@/components/sections/pathway-timeline";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { StoryCard } from "@/components/cards/story-card";
import { Section, FactsTable, Prose, PendingLine, VerificationNote, SourceNote, NextSteps } from "@/components/pages";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPathwayBySlug(slug);
  if (!p) return { title: "Pathway not found" };
  return pageMetadata({ title: p.title, description: p.summary || `${p.title} — a pathway from St Hugh's College Vientiane.`, path: `/pathways/${p.slug}` });
}

export default async function PathwayPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [pathway, messaging] = await Promise.all([getPathwayBySlug(slug), getMessagingSettings()]);
  if (!pathway) notFound();

  const careers = splitList(pathway.careerDirections);
  const transferStep = pathway.steps.find((s, i) => i > 0 && s.location && !/vientiane/i.test(s.location));
  const nextSteps = [
    ...(pathway.university ? [{ label: pathway.university.name, description: "Partner or network receiving students on this route", href: `/universities/${pathway.university.slug}` }] : []),
    ...(pathway.destination ? [{ label: pathway.destination.country, description: "Destination overview, requirements and official source", href: `/destinations/${pathway.destination.slug}` }] : []),
    ...(pathway.programme ? [{ label: pathway.programme.shortTitle ?? pathway.programme.title, description: "The programme you complete in Vientiane first", href: `/programmes/${pathway.programme.slug}` }] : []),
    { label: "Compare with another route", description: "Duration, transfer point, qualification and requirements side by side", href: "/compare" },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Pathways", href: "/pathways" }, { label: pathway.title, href: `/pathways/${pathway.slug}` }]} />
      <PageHero
        eyebrow={
          <>
            {pathway.subjectArea ?? "Pathway"}
            {pathway.code ? <span className="text-fg-subtle">· {pathway.code}</span> : null}
          </>
        }
        title={pathway.title}
        lede={pathway.summary || undefined}
        aside={
          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-6 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
              <div>
                <dt className="text-fg-subtle">Structure</dt>
                <dd className="font-display mt-2 text-[2.75rem] normal-case tracking-normal text-gold-soft tabular">{pathway.structureLabel ? pathway.structureLabel.replace(/\s+/g, "") : "—"}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Total duration</dt>
                <dd className="mt-2 normal-case tracking-normal text-fg">{pathway.totalDurationLabel ?? "Confirmed by the admissions team"}</dd>
              </div>
            </dl>
            <VerificationNote status={pathway.verificationStatus} />
          </div>
        }
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/universities" arrow="right">
            Explore universities
          </Button>
          <Button href="/consultation" variant="secondary">
            Book a consultation
          </Button>
        </div>
      </PageHero>

      <Section eyebrow="The route" title="Step by step, from Vientiane" lede="The origin node is lit. Each step shows where you are, who you are with and for how long." layout="full">
        <PathwayTimeline steps={pathway.steps} orientation="horizontal" />
      </Section>

      <Section eyebrow="Route facts" title="What this pathway tells you" lede={messaging.guidanceDisclaimer}>
        <FactsTable
          rows={[
            { label: "Start location", value: pathway.startLocation },
            { label: "Duration", value: pathway.totalDurationLabel },
            { label: "Transfer", value: pathway.transferPoint ?? (transferStep ? `${transferStep.label} → ${transferStep.location}` : null) },
            { label: "Partner", value: pathway.partnerName ?? pathway.university?.name ?? null, pending: "Partner confirmed before publication" },
            { label: "Qualification", value: pathway.qualification },
            { label: "Field", value: pathway.field ?? pathway.subjectArea ?? null },
          ]}
        />
      </Section>

      <Section eyebrow="Progression requirements" title="What you need to move on" lede="Requirements are those published for the chosen university and course. An advisor will explain exactly what applies to you.">
        <Prose text={pathway.progressionRequirements} pending="Progression requirements are confirmed by the admissions team for the chosen course." />
      </Section>

      <Section eyebrow="Career directions" title="Where graduates of this field tend to go" lede="Directions, not promises — the subject family this route serves.">
        {careers.length ? (
          <ul className="flex flex-wrap gap-3">
            {careers.map((c) => (
              <li key={c} className="inline-flex h-11 items-center rounded-[var(--radius-sm)] border border-line-strong px-4 text-[0.9375rem] text-fg">
                {c}
              </li>
            ))}
          </ul>
        ) : (
          <PendingLine>Career directions are published once confirmed.</PendingLine>
        )}
        <div className="mt-8">
          <Button href="/careers" variant="ghost" arrow="right">
            Careers and employability at SHV
          </Button>
        </div>
      </Section>

      <Section eyebrow="Application" title="How to apply for this route">
        <Prose text={pathway.applicationNotes} pending="Applications begin with a free consultation; the admissions team confirms the steps for this route." />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/consultation" arrow="right">
            Book a free consultation
          </Button>
          <Button href="/admissions" variant="secondary">
            Admissions journey
          </Button>
        </div>
      </Section>

      {pathway.programme ? (
        <Section eyebrow="Start here" title="The programme you complete first" layout="full">
          <div className="grid lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ProgrammeCard programme={pathway.programme} />
            </div>
          </div>
        </Section>
      ) : (
        <Section eyebrow="Start here" title="The programme you complete first">
          <PendingLine>The programme attached to this route is confirmed before publication.</PendingLine>
        </Section>
      )}

      <Section eyebrow="Connected" title="Along this route">
        <NextSteps items={nextSteps} />
      </Section>

      {pathway.stories.length ? (
        <Section eyebrow="Student stories" title="Students on this route" layout="full">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pathway.stories.map((s, i) => (
              <Reveal key={s.id} delay={i * 40}>
                <StoryCard story={{ ...s, destination: pathway.destination, university: pathway.university, programme: pathway.programme ? { title: pathway.programme.title, shortTitle: pathway.programme.shortTitle } : null }} />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      <section className="container-x pb-6">
        <SourceNote note={pathway.sourceNote} />
        {pathway.destination?.officialLink ? (
          <p className="mt-3 text-sm text-fg-subtle">
            Official source:{" "}
            <Link href={pathway.destination.officialLink} target="_blank" rel="noopener noreferrer" className="text-gold-soft underline underline-offset-4">
              {pathway.destination.officialLink.replace(/^https?:\/\//, "")}
            </Link>
          </p>
        ) : null}
      </section>

      <ConsultationBand title="See where this route leads" body="Explore the universities and destinations on this pathway, or book a free consultation to check your fit." primaryHref={pathway.destination ? `/destinations/${pathway.destination.slug}` : "/universities"} primaryLabel="Explore universities" secondaryHref="/consultation" secondaryLabel="Book a consultation" />
    </>
  );
}
