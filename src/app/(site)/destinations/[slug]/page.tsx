import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestinationBySlug, getPathways } from "@/lib/content";
import { getStoriesForDestination } from "@/lib/content-pages";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PathwayCard } from "@/components/cards/pathway-card";
import { UniversityCard } from "@/components/cards/university-card";
import { StoryCard } from "@/components/cards/story-card";
import { Section, FactsTable, Prose, VerificationNote, SourceNote } from "@/components/pages";
import { Plate } from "@/components/ui/plate";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDestinationBySlug(slug);
  if (!d) return { title: "Destination not found" };
  return pageMetadata({ title: `Study in ${d.country}`, description: d.summary || `Pathways from St Hugh's College Vientiane to ${d.country}.`, path: `/destinations/${d.slug}`, image: d.heroMedia?.usageStatus === "APPROVED" ? d.heroMedia.url : null });
}

export default async function DestinationPage({ params }: { params: Params }) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();
  const [pathways, stories] = await Promise.all([getPathways({ destinationSlug: destination.slug }), getStoriesForDestination(destination.slug)]);
  const official = destination.officialLink?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <>
      <Breadcrumbs items={[{ label: "Destinations", href: "/destinations" }, { label: destination.country, href: `/destinations/${destination.slug}` }]} />
      <PageHero
        eyebrow={
          <>
            {destination.isoCode}
            {destination.region ? <span className="text-fg-subtle">· {destination.region}</span> : null}
          </>
        }
        title={destination.country}
        lede={destination.summary || undefined}
        aside={
          <div className="space-y-6">
            <Plate media={destination.heroMedia} slot={`Destination — ${destination.country}`} aspect="4/3" sizes="(min-width:1024px) 33vw, 100vw" />
            <VerificationNote status={destination.verificationStatus} />
          </div>
        }
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="#pathways" arrow="right">
            See the routes here
          </Button>
          <Button href="/consultation" variant="secondary">
            Book a consultation
          </Button>
        </div>
      </PageHero>

      <Section eyebrow="Destination facts" title="What leads here" lede="Only the pathway types and routes attached to this destination are shown.">
        <FactsTable
          rows={[
            { label: "Pathway types", value: destination.pathwayTypes || null, pending: "Confirmed before publication" },
            { label: "Duration notes", value: destination.durationNotes, pending: "Shown per route below" },
            { label: "Universities listed", value: destination.universities.length ? String(destination.universities.length) : null, pending: "Published as confirmed" },
            { label: "Published routes", value: pathways.length ? String(pathways.length) : null, pending: "Routes being confirmed" },
            {
              label: "Official source",
              value: destination.officialLink ? (
                <a href={destination.officialLink} target="_blank" rel="noopener noreferrer" data-analytics="outbound_partner_click" className="underline decoration-route underline-offset-4 hover:text-brand-soft">
                  {official} ↗
                </a>
              ) : null,
              pending: "Official link published when confirmed",
            },
          ]}
        />
      </Section>

      <Section eyebrow="Requirements" title="What you need for this destination" lede="Requirements are set by the receiving university and course. An advisor will explain what applies to your chosen route.">
        <Prose text={destination.requirements} pending="Requirements are published per route once confirmed." />
      </Section>

      <Section eyebrow="Progression" title="How progression works here">
        <Prose text={destination.progressionNotes} pending="Progression notes are confirmed before publication." />
      </Section>

      <Section eyebrow="Universities" title={`Universities in ${destination.country}`} layout="full">
        {destination.universities.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {destination.universities.map((u, i) => (
              <Reveal key={u.id} delay={i * 40}>
                <UniversityCard university={{ ...u, destination }} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Universities in this destination are published as confirmed" />
        )}
      </Section>

      <Section id="pathways" eyebrow="Pathways" title="Routes to this destination" lede="Each route starts in Vientiane. Structure, transfer point and partner are shown on the card." layout="full">
        {pathways.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pathways.map((p, i) => (
              <Reveal key={p.id} delay={i * 40}>
                <PathwayCard pathway={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Routes to this destination are being confirmed" body="A pathway appears here once its structure is confirmed with the partner." />
        )}
      </Section>

      {stories.length ? (
        <Section eyebrow="Student stories" title={`Students who chose ${destination.country}`} layout="full">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((s, i) => (
              <Reveal key={s.id} delay={i * 40}>
                <StoryCard story={s} />
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      <section className="container-x pb-6">
        <SourceNote note={destination.sourceNote} />
      </section>

      <ConsultationBand title={`Thinking about ${destination.country}?`} body="Explore the pathways that lead here, or book a free consultation to check the requirements against your qualifications." primaryHref="/pathways" primaryLabel="Explore pathways" secondaryHref="/consultation" secondaryLabel="Book a consultation" />
    </>
  );
}
