import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUniversityBySlug } from "@/lib/content";
import { getPathwaysForUniversity, getRelatedNews } from "@/lib/content-pages";
import { pageMetadata } from "@/lib/seo";
import { PARTNERSHIP_TYPE_LABELS, type PartnershipType } from "@/lib/enums";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PathwayCard } from "@/components/cards/pathway-card";
import { NewsCard } from "@/components/cards/news-card";
import { Section, FactsTable, Prose, VerificationNote, SourceNote, NextSteps } from "@/components/pages";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const u = await getUniversityBySlug(slug);
  if (!u) return { title: "University not found" };
  return pageMetadata({ title: u.name, description: u.summary || `${u.name} — a university in the St Hugh's College Vientiane pathway network.`, path: `/universities/${u.slug}` });
}

export default async function UniversityPage({ params }: { params: Params }) {
  const { slug } = await params;
  const university = await getUniversityBySlug(slug);
  if (!university) notFound();
  const [pathways, news] = await Promise.all([getPathwaysForUniversity(university.slug), getRelatedNews({ universitySlug: university.slug, take: 3 })]);
  const logo = university.logo && university.logo.usageStatus === "APPROVED" ? university.logo : null;
  const partnership = PARTNERSHIP_TYPE_LABELS[university.partnershipType as PartnershipType] ?? university.partnershipType;
  const website = university.website?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <>
      <Breadcrumbs items={[{ label: "Universities", href: "/universities" }, { label: university.name, href: `/universities/${university.slug}` }]} />
      <PageHero
        eyebrow={
          <>
            {partnership}
            {university.destination ? <span className="text-fg-subtle">· {university.destination.country}</span> : null}
          </>
        }
        title={university.name}
        lede={university.summary || undefined}
        aside={
          <div className="space-y-6">
            {logo ? (
              <div className="flex h-24 items-center rounded-[var(--radius)] border border-line bg-bg-raised px-6">
                <Image src={logo.url} alt={logo.alt || university.name} width={logo.width ?? 240} height={logo.height ?? 72} className="max-h-14 w-auto object-contain" />
              </div>
            ) : null}
            <dl className="grid grid-cols-2 gap-6 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
              <div>
                <dt className="text-fg-subtle">Location</dt>
                <dd className="mt-2 normal-case tracking-normal text-fg">{[university.city, university.destination?.country].filter(Boolean).join(", ") || "Confirmed by the admissions team"}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Published routes</dt>
                <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{pathways.length}</dd>
              </div>
            </dl>
            <VerificationNote status={university.verificationStatus} />
          </div>
        }
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={pathways[0] ? `/pathways/${pathways[0].slug}` : "/pathways"} arrow="right">
            View pathway
          </Button>
          <Button href="/enquire" variant="secondary">
            Enquire
          </Button>
        </div>
      </PageHero>

      <Section eyebrow="Institution facts" title="At a glance">
        <FactsTable
          rows={[
            { label: "Partnership type", value: <Badge tone="gold">{partnership}</Badge> },
            { label: "Transfer point", value: university.transferPoint, pending: "Confirmed before publication" },
            { label: "City", value: university.city },
            { label: "Country", value: university.destination ? <Link href={`/destinations/${university.destination.slug}`} className="underline decoration-route underline-offset-4 hover:text-brand-soft">{university.destination.country}</Link> : null },
            {
              label: "Official website",
              value: university.website ? (
                <a href={university.website} target="_blank" rel="noopener noreferrer" data-analytics="outbound_partner_click" className="underline decoration-route underline-offset-4 hover:text-brand-soft">
                  {website} ↗
                </a>
              ) : null,
              pending: "Published when confirmed",
            },
          ]}
        />
      </Section>

      <Section eyebrow="Programmes offered" title="What you can progress to" lede="Programme information is published as confirmed with the institution; the official website is the authoritative source.">
        <Prose text={university.programmesOffered} pending="Programme information is published once confirmed with the institution." />
      </Section>

      <Section eyebrow="Progression" title="How students progress here" lede="Progression is always subject to the published requirements of the chosen course.">
        <Prose text={university.progressionInfo} pending="Progression information is confirmed before publication." />
      </Section>

      <Section eyebrow="Pathways" title="Routes leading here" lede="Only routes that name this institution are shown." layout="full">
        {pathways.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pathways.map((p, i) => (
              <Reveal key={p.id} delay={i * 40}>
                <PathwayCard pathway={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Routes to this institution are published once confirmed" body="The structure of each route is confirmed with the partner before it appears here." />
        )}
      </Section>

      {news.length ? (
        <Section eyebrow="News" title="Related news" layout="full">
          <div className="grid gap-8 md:grid-cols-3">
            {news.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section eyebrow="Connected" title="Continue the route">
        <NextSteps
          items={[
            ...(university.destination ? [{ label: university.destination.country, description: "Destination overview and official source", href: `/destinations/${university.destination.slug}` }] : []),
            { label: "All universities", description: "The network and named institutions", href: "/universities" },
            { label: "Pathway Explorer", description: "Trace a route interactively from Vientiane", href: "/pathway-explorer" },
          ]}
        />
      </Section>

      <section className="container-x pb-6">
        <SourceNote note={university.sourceNote} />
      </section>

      <ConsultationBand title="Interested in this institution?" body="View the pathway that leads here, or send an enquiry and the admissions team will explain what the route requires." primaryHref={pathways[0] ? `/pathways/${pathways[0].slug}` : "/pathways"} primaryLabel="View pathway" secondaryHref="/enquire" secondaryLabel="Enquire" />
    </>
  );
}
