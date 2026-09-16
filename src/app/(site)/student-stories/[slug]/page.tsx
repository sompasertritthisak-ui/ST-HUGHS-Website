import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentStoryBySlug } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { PathwayTimeline } from "@/components/sections/pathway-timeline";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { Section, FactsTable, Prose, VerificationNote, NextSteps } from "@/components/pages";
import { Plate } from "@/components/ui/plate";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const s = await getStudentStoryBySlug(slug);
  if (!s) return { title: "Story not found" };
  return pageMetadata({ title: `${s.studentName} — student story`, description: s.quote ?? s.outcome ?? `${s.studentName}'s journey from St Hugh's College Vientiane.`, path: `/student-stories/${s.slug}`, image: s.photo?.usageStatus === "APPROVED" ? s.photo.url : null });
}

export default async function StoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const story = await getStudentStoryBySlug(slug);
  if (!story) notFound();
  const routeSteps = [
    { id: "origin", label: story.programme ? story.programme.shortTitle ?? story.programme.title : "SHV", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", description: story.previousEducation ? `Previously: ${story.previousEducation}` : null },
    ...(story.destination || story.university ? [{ id: "destination", label: "Progression", location: story.destination?.country ?? null, institution: story.university?.name ?? null }] : []),
    ...(story.outcome ? [{ id: "outcome", label: "Outcome", description: story.outcome }] : []),
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Student stories", href: "/student-stories" }, { label: story.studentName, href: `/student-stories/${story.slug}` }]} />
      <PageHero
        eyebrow={
          <>
            Student story
            {story.programme ? <span className="text-fg-subtle">· {story.programme.shortTitle ?? story.programme.title}</span> : null}
          </>
        }
        title={story.quote ? <>“{story.quote}”</> : story.studentName}
        lede={story.quote ? `${story.studentName}${story.destination ? ` — now in ${story.destination.country}` : ""}` : undefined}
        aside={
          <div className="space-y-6">
            <Plate media={story.photo} slot={`Student portrait — ${story.studentName}`} aspect="3/4" sizes="(min-width:1024px) 33vw, 100vw" priority />
            <VerificationNote status={story.verificationStatus} />
          </div>
        }
      />

      <Section eyebrow="The route" title={`${story.studentName}'s journey`} layout="full">
        <PathwayTimeline steps={routeSteps} orientation="horizontal" />
      </Section>

      <Section eyebrow="In their words" title="The SHV journey">
        <Prose text={story.journey} markdown pending="The full story is published as approved." />
      </Section>

      <Section eyebrow="Facts" title="Route at a glance">
        <FactsTable
          rows={[
            { label: "Programme", value: story.programme ? <Link href={`/programmes/${story.programme.slug}`} className="underline decoration-route underline-offset-4 hover:text-brand-soft">{story.programme.title}</Link> : null },
            { label: "Pathway", value: story.pathway ? <Link href={`/pathways/${story.pathway.slug}`} className="underline decoration-route underline-offset-4 hover:text-brand-soft">{story.pathway.title}</Link> : null, pending: "Published as confirmed" },
            { label: "Previous education", value: story.previousEducation, pending: "Published as approved" },
            { label: "Destination", value: story.destination ? <Link href={`/destinations/${story.destination.slug}`} className="underline decoration-route underline-offset-4 hover:text-brand-soft">{story.destination.country}</Link> : null, pending: "Published as confirmed" },
            { label: "University", value: story.university ? <Link href={`/universities/${story.university.slug}`} className="underline decoration-route underline-offset-4 hover:text-brand-soft">{story.university.name}</Link> : null, pending: "Published as confirmed" },
            { label: "Outcome", value: story.outcome, pending: "Published with progression evidence" },
          ]}
        />
        {story.progressionEvidence ? <p className="mt-4 font-mono text-[0.6875rem] tracking-[0.06em] text-fg-subtle"><span className="uppercase tracking-[0.14em]">Evidence</span> {story.progressionEvidence}</p> : null}
      </Section>

      {story.videoUrl ? (
        <Section eyebrow="Video" title="Watch">
          <a href={story.videoUrl} target="_blank" rel="noopener noreferrer" className="text-brand-soft underline underline-offset-4">
            Watch {story.studentName}&apos;s story ↗
          </a>
        </Section>
      ) : null}

      {story.programme ? (
        <Section eyebrow="Start here" title="The programme behind this story" layout="full">
          <div className="grid lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ProgrammeCard programme={story.programme} />
            </div>
          </div>
        </Section>
      ) : null}

      <Section eyebrow="Connected" title="Follow the route">
        <NextSteps
          items={[
            ...(story.pathway ? [{ label: story.pathway.title, description: "The pathway this student followed", href: `/pathways/${story.pathway.slug}` }] : []),
            { label: "All student stories", description: "More real journeys", href: "/student-stories" },
            { label: "Explore your pathway", description: "Trace your own route from Vientiane", href: "/pathway-explorer" },
          ]}
        />
      </Section>

      <ConsultationBand
        title={story.programme ? `Start where ${story.studentName} started` : "Start your own route"}
        body="Explore the programme behind this story, or talk to an advisor about your own plan."
        primaryHref={story.programme ? `/programmes/${story.programme.slug}` : "/programmes"}
        primaryLabel="Explore the programme"
        secondaryHref="/consultation"
        secondaryLabel="Talk to an advisor"
      />
    </>
  );
}
