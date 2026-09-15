import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgrammeBySlug, getMessagingSettings } from "@/lib/content";
import { getRelatedNews } from "@/lib/content-pages";
import { pageMetadata, courseJsonLd, faqPageJsonLd } from "@/lib/seo";
import { parseStringArray } from "@/lib/utils";
import { PROGRAMME_TYPE_LABELS, type ProgrammeType } from "@/lib/enums";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { ProgrammeJourney } from "@/components/sections/programme-journey";
import { PathwayTimeline } from "@/components/sections/pathway-timeline";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { PathwayCard } from "@/components/cards/pathway-card";
import { StoryCard } from "@/components/cards/story-card";
import { NewsCard } from "@/components/cards/news-card";
import { Section, FactsTable, Prose, PendingLine, VerificationNote, SourceNote } from "@/components/pages";
import { Accordion } from "@/components/ui/accordion";
import { Plate } from "@/components/ui/plate";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProgrammeBySlug(slug);
  if (!p) return { title: "Programme not found" };
  return pageMetadata({ title: p.seoTitle ?? p.title, description: p.seoDescription ?? p.summary, path: `/programmes/${p.slug}`, image: p.heroMedia?.usageStatus === "APPROVED" ? p.heroMedia.url : null });
}

const MODULE_KIND_LABELS: Record<string, string> = { CORE: "Core", SUBJECT: "Subject", SKILLS: "Skills", ENGLISH: "English" };

export default async function ProgrammePage({ params }: { params: Params }) {
  const { slug } = await params;
  const [programme, messaging] = await Promise.all([getProgrammeBySlug(slug), getMessagingSettings()]);
  if (!programme) notFound();
  const news = await getRelatedNews({ programmeSlug: programme.slug, take: 3 });

  const intakes = parseStringArray(programme.intakesJson);
  const routes = parseStringArray(programme.subjectRoutesJson);
  const typeLabel = PROGRAMME_TYPE_LABELS[programme.type as ProgrammeType] ?? programme.type;
  const pathways = programme.pathways.map((p) => ({ ...p, programme: { slug: programme.slug, title: programme.title, shortTitle: programme.shortTitle, type: programme.type } }));
  const primaryPathway = pathways.find((p) => p.featured) ?? pathways[0];
  const destinations = Array.from(new Map(pathways.filter((p) => p.destination).map((p) => [p.destination!.slug, p.destination!])).values());

  const stations = [
    { question: "Where are you now?", answer: programme.whoFor ?? "Who this programme is for is confirmed by the admissions team.", href: "#who" },
    { question: "What do you want to study?", answer: routes.length ? routes.join(" · ") : "Subject routes confirmed per intake.", href: "#routes" },
    { question: "Which programme fits?", answer: `${typeLabel}${programme.level ? ` — ${programme.level}` : ""}`, href: "#what" },
    { question: "Where can it lead?", answer: destinations.length ? destinations.map((d) => d.country).join(", ") : "Progression routes are published once confirmed.", href: "#progression" },
    { question: "Entry requirements", answer: programme.entryRequirements ? "Published below, with English requirement." : "Confirmed by the admissions team.", href: "#entry" },
    { question: "What will you study?", answer: programme.modules.length ? `${programme.modules.length} components` : "Module structure confirmed per intake.", href: "#structure" },
    { question: "How long?", answer: programme.durationLabel ?? "Confirmed per intake.", href: "#duration" },
    { question: "What happens after SHV?", answer: programme.whatNext ?? "Confirmed by the admissions team.", href: "#after" },
    { question: "How do I apply?", answer: "Start with a free consultation.", href: "#apply" },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Programmes", href: "/programmes" }, { label: programme.shortTitle ?? programme.title, href: `/programmes/${programme.slug}` }]} />
      <PageHero
        eyebrow={
          <>
            {typeLabel}
            {programme.awardingBody ? <span className="text-fg-subtle">· {programme.awardingBody}</span> : null}
            {programme.code ? <span className="text-fg-subtle">· {programme.code}</span> : null}
          </>
        }
        title={programme.title}
        lede={programme.summary}
        aside={
          <div className="space-y-6">
            <Plate media={programme.heroMedia} slot={`Programme hero — ${programme.shortTitle ?? programme.title}`} aspect="4/3" sizes="(min-width:1024px) 33vw, 100vw" />
            <VerificationNote status={programme.verificationStatus} />
          </div>
        }
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/pathway-finder" arrow="right">
            Check your eligibility
          </Button>
          <Button href="/consultation" variant="secondary">
            Talk to an advisor
          </Button>
        </div>
      </PageHero>

      <section aria-labelledby="journey-title" className="container-x pb-6">
        <h2 id="journey-title" className="sr-only">
          Your journey through this programme
        </h2>
        <ProgrammeJourney stations={stations} />
      </section>

      <Section id="what" eyebrow="What it is" title="The programme">
        <Prose text={programme.description} markdown pending="Full programme description is published when approved." />
      </Section>

      <Section id="who" eyebrow="Who it is for" title="Is this the right starting point?">
        <Prose text={programme.whoFor} />
        <div className="mt-8">
          <Button href="/pathway-finder" variant="ghost" arrow="right">
            Check your eligibility with the Pathway Finder
          </Button>
        </div>
      </Section>

      <Section id="structure" eyebrow="What you study" title="Structure and modules" lede="Components of the programme as delivered at SHV. Module titles for a given intake are confirmed by the academic team.">
        {programme.modules.length ? (
          <ol className="divide-y divide-line border-y border-line">
            {programme.modules.map((m, i) => (
              <Reveal key={m.id} as="li" delay={i * 40} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle sm:col-span-2">{String(i + 1).padStart(2, "0")}</span>
                <div className="sm:col-span-7">
                  <p className="text-[1.0625rem] font-medium text-fg">{m.title}</p>
                  {m.description ? <p className="mt-1 text-sm leading-relaxed text-fg-muted">{m.description}</p> : null}
                </div>
                <div className="flex items-start gap-2 sm:col-span-3 sm:justify-end">
                  <Badge tone="gold">{MODULE_KIND_LABELS[m.kind] ?? m.kind}</Badge>
                  {m.credits ? <Badge>{m.credits} credits</Badge> : null}
                </div>
              </Reveal>
            ))}
          </ol>
        ) : (
          <PendingLine>Module structure is confirmed per intake by the academic team.</PendingLine>
        )}
      </Section>

      <Section id="routes" eyebrow="Subject routes" title="Available routes at SHV" lede="Routes shape which subject modules you take and which degrees you can progress to.">
        {routes.length ? (
          <ul className="flex flex-wrap gap-3">
            {routes.map((r) => (
              <li key={r}>
                <Link href={`/pathways?programme=${programme.slug}&subject=${encodeURIComponent(r)}`} className="inline-flex h-11 items-center rounded-[var(--radius-sm)] border border-line-strong px-4 text-[0.9375rem] text-fg transition-colors hover:border-route hover:text-gold-soft">
                  {r}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <PendingLine>Subject routes are confirmed per intake.</PendingLine>
        )}
      </Section>

      <Section id="duration" eyebrow="Duration and intakes" title="How long, and when">
        <FactsTable
          rows={[
            { label: "Duration", value: programme.durationLabel, pending: "Confirmed per intake" },
            { label: "Intakes", value: intakes.length ? intakes.join(", ") : null, pending: "Confirmed by the admissions team" },
            { label: "Study location", value: programme.studyLocation },
            { label: "Level", value: programme.level },
          ]}
        />
      </Section>

      <Section id="entry" eyebrow="Entry requirements" title="What you need to start" lede={messaging.guidanceDisclaimer}>
        <FactsTable
          columns={1}
          rows={[
            { label: "Academic entry requirements", value: programme.entryRequirements },
            { label: "English requirement", value: programme.englishRequirement },
            { label: "Assessment", value: programme.assessment },
            { label: "Qualification awarded", value: programme.qualification },
          ]}
        />
      </Section>

      <Section id="progression" eyebrow="Progression" title="Where it can lead" lede="Only pathways attached to this programme are shown. Progression is subject to the published requirements of the chosen university and course.">
        <Prose text={programme.progression} pending="Progression details are published once confirmed." />
        {primaryPathway ? (
          <div className="mt-10">
            <p className="eyebrow eyebrow-rule mb-6">Example route · {primaryPathway.structureLabel ?? primaryPathway.title}</p>
            <PathwayTimeline steps={primaryPathway.steps} orientation="horizontal" />
          </div>
        ) : null}
      </Section>

      {pathways.length ? (
        <Section eyebrow="Pathways" title="Routes from this programme" layout="full" aside={<Button href={`/pathways?programme=${programme.slug}`} variant="ghost" arrow="right">All routes for this programme</Button>}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pathways.map((p, i) => (
              <Reveal key={p.id} delay={i * 40}>
                <PathwayCard pathway={p} />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      <Section id="after" eyebrow="After SHV" title="What happens next">
        <Prose text={programme.whatNext} />
      </Section>

      <Section id="apply" eyebrow="Application journey" title="How to apply" lede="The admissions team guides each step. There is no consultation fee.">
        <Prose text={programme.applicationNotes} pending="Application steps are confirmed by the admissions team." />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/consultation" arrow="right">
            Book a free consultation
          </Button>
          <Button href="/admissions" variant="secondary">
            See the admissions journey
          </Button>
        </div>
      </Section>

      {programme.stories.length ? (
        <Section eyebrow="Student stories" title="Students on this programme" layout="full">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {programme.stories.map((s, i) => (
              <Reveal key={s.id} delay={i * 40}>
                <StoryCard story={{ ...s, programme: { title: programme.title, shortTitle: programme.shortTitle } }} />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {programme.faqs.length ? (
        <Section eyebrow="FAQ" title="Questions about this programme">
          <Accordion items={programme.faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          <JsonLd data={faqPageJsonLd(programme.faqs)} />
        </Section>
      ) : null}

      {news.length ? (
        <Section eyebrow="News" title="Related news" layout="full">
          <div className="grid gap-8 md:grid-cols-3">
            {news.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </Section>
      ) : null}

      <section className="container-x pb-6">
        <SourceNote note={programme.sourceNote} />
      </section>

      <JsonLd data={courseJsonLd(programme)} />
      <ConsultationBand title="Check whether this route fits you" body="Use the Pathway Finder for guidance in a few steps, or book a free consultation and an advisor will check your qualifications against the entry requirements." primaryHref="/pathway-finder" primaryLabel="Check your eligibility" secondaryHref="/consultation" secondaryLabel="Talk to an advisor" />
    </>
  );
}
