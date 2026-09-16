import Link from "next/link";
import Image from "next/image";
import { parseBlock, type BlockData } from "@/lib/blocks";
import {
  getProgrammes,
  getUniversities,
  getPathwayBySlug,
  getDestinations,
  getStudentStories,
  getStudentStoryBySlug,
  getFaqs,
  getPartners,
  getOutcomeMetrics,
} from "@/lib/content";
import { getApprovedMedia } from "@/lib/content-pages";
import { PageHero } from "@/components/sections/page-hero";
import { PathwayTimeline } from "@/components/sections/pathway-timeline";
import { Markdown } from "@/components/ui/markdown";
import { Plate } from "@/components/ui/plate";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { RouteLine } from "@/components/ui/route-line";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { UniversityCard } from "@/components/cards/university-card";
import { DestinationCard } from "@/components/cards/destination-card";
import { StoryCard } from "@/components/cards/story-card";
import { Section } from "@/components/pages/section";
import { PendingLine } from "@/components/pages/pending";
import { JsonLd } from "@/components/site/json-ld";
import { faqPageJsonLd } from "@/lib/seo";
import { FAQ_CATEGORY_LABELS, type FaqCategory } from "@/lib/enums";
import type { ContentBlock } from "@prisma/client";

/**
 * Renders a page's ContentBlocks in order. Data-driven blocks read PUBLISHED
 * rows through the content layer; nothing here carries hardcoded catalogue data.
 */
export async function BlockRenderer({ blocks, fallbackTitle }: { blocks: ContentBlock[]; fallbackTitle: string }) {
  const parsed = blocks.map(parseBlock).filter((b): b is NonNullable<typeof b> => b !== null);
  const hasHero = parsed.some((b) => b.type === "HERO");
  return (
    <>
      {!hasHero ? <PageHero title={fallbackTitle} /> : null}
      {parsed.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </>
  );
}

type Parsed = NonNullable<ReturnType<typeof parseBlock>>;

async function Block({ block }: { block: Parsed }) {
  switch (block.type) {
    case "HERO":
      return <PageHero eyebrow={block.data.eyebrow || undefined} title={block.data.title} lede={block.data.lede || undefined} />;
    case "RICH_TEXT":
      return <RichTextBlock data={block.data} />;
    case "IMAGE":
      return <ImageBlock data={block.data} />;
    case "VIDEO":
      return <VideoBlock data={block.data} />;
    case "STATISTICS":
      return <StatisticsBlock data={block.data} />;
    case "PROGRAMME_GRID":
      return <ProgrammeGridBlock data={block.data} />;
    case "UNIVERSITY_GRID":
      return <UniversityGridBlock data={block.data} />;
    case "PATHWAY_TIMELINE":
      return <PathwayTimelineBlock data={block.data} />;
    case "MAP":
      return <MapBlock data={block.data} />;
    case "TESTIMONIAL":
      return <TestimonialBlock data={block.data} />;
    case "STUDENT_STORY":
      return <StudentStoryBlock data={block.data} />;
    case "FAQ":
      return <FaqBlock data={block.data} />;
    case "CTA":
      return <CtaBlock data={block.data} />;
    case "GALLERY":
      return <GalleryBlock data={block.data} />;
    case "COMPARISON_TABLE":
      return <ComparisonTableBlock data={block.data} />;
    case "LOGO_WALL":
      return <LogoWallBlock data={block.data} />;
    case "QUOTE":
      return <QuoteBlock data={block.data} />;
    case "MEDIA":
      return <MediaBlock data={block.data} />;
    default:
      return null;
  }
}

// ── Individual blocks ───────────────────────────────────────────────────────

function RichTextBlock({ data }: { data: BlockData["RICH_TEXT"] }) {
  return (
    <section className="container-x py-12 md:py-16">
      <div className="grid lg:grid-cols-12">
        <div className="lg:col-span-8 lg:col-start-4">
          <Markdown>{data.body}</Markdown>
        </div>
      </div>
    </section>
  );
}

async function ImageBlock({ data }: { data: BlockData["IMAGE"] }) {
  const [media] = data.mediaId ? await getApprovedMedia([data.mediaId]) : [];
  return (
    <section className="container-x py-8">
      <Plate media={media ?? null} slot={data.slot || "Page image"} aspect={data.aspect} caption={data.caption || undefined} sizes="(min-width:1320px) 1320px, 100vw" />
    </section>
  );
}

function safeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : u.pathname.startsWith("/embed/") ? `https://www.youtube-nocookie.com${u.pathname}` : null;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed${u.pathname}`;
    if (u.hostname === "vimeo.com") return `https://player.vimeo.com/video${u.pathname}`;
    if (u.hostname === "player.vimeo.com" || u.hostname === "www.youtube-nocookie.com") return u.toString();
    return null;
  } catch {
    return null;
  }
}

function VideoBlock({ data }: { data: BlockData["VIDEO"] }) {
  const src = safeEmbedUrl(data.url);
  return (
    <section className="container-x py-8">
      <figure>
        <div className="relative aspect-video overflow-hidden rounded-[var(--radius)] border border-line bg-bg-raised">
          {src ? (
            <iframe src={src} title={data.title || "Video"} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-brand-soft underline underline-offset-4">
                {data.title || "Watch the video"}
              </a>
            </div>
          )}
        </div>
        {data.caption ? <figcaption className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{data.caption}</figcaption> : null}
      </figure>
    </section>
  );
}

async function StatisticsBlock({ data }: { data: BlockData["STATISTICS"] }) {
  const all = await getOutcomeMetrics();
  const metrics = data.keys.length ? all.filter((m) => data.keys.includes(m.key)) : all;
  return (
    <Section eyebrow="Outcomes" title={data.title || "Verified outcomes"} lede={data.lede || "Figures are published only once verified. Empty tiles show where data is still being confirmed."} layout="full">
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Reveal key={m.key} delay={i * 40}>
            <Stat label={m.label} value={m.value} unit={m.unit} sourceNote={m.sourceNote} verified={m.verificationStatus === "VERIFIED"} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

async function ProgrammeGridBlock({ data }: { data: BlockData["PROGRAMME_GRID"] }) {
  const programmes = await getProgrammes({ featured: data.featuredOnly, type: data.type });
  return (
    <Section eyebrow="Programmes" title={data.title || "Programmes"} lede={data.lede || undefined} layout="full" aside={<Button href="/programmes" variant="ghost" arrow="right">All programmes</Button>}>
      {programmes.length ? (
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
          {programmes.map((p, i) => (
            <Reveal key={p.id} delay={i * 40}>
              <ProgrammeCard programme={p} index={i} />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState title="Programmes are published as they are approved" />
      )}
    </Section>
  );
}

async function UniversityGridBlock({ data }: { data: BlockData["UNIVERSITY_GRID"] }) {
  const universities = await getUniversities({ featured: data.featuredOnly });
  return (
    <Section eyebrow="Universities" title={data.title || "University network"} lede={data.lede || undefined} layout="full" aside={<Button href="/universities" variant="ghost" arrow="right">All universities</Button>}>
      {universities.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {universities.map((u, i) => (
            <Reveal key={u.id} delay={i * 40}>
              <UniversityCard university={u} />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState title="Universities are published as partnerships are confirmed" />
      )}
    </Section>
  );
}

async function PathwayTimelineBlock({ data }: { data: BlockData["PATHWAY_TIMELINE"] }) {
  const pathway = await getPathwayBySlug(data.pathwaySlug);
  if (!pathway) return null;
  return (
    <Section eyebrow={pathway.structureLabel ?? "Pathway"} title={data.title || pathway.title} lede={pathway.summary} layout="full" aside={<Button href={`/pathways/${pathway.slug}`} variant="ghost" arrow="right">View this pathway</Button>}>
      <PathwayTimeline steps={pathway.steps} orientation={data.orientation} />
    </Section>
  );
}

async function MapBlock({ data }: { data: BlockData["MAP"] }) {
  const destinations = await getDestinations();
  return (
    <Section eyebrow="Destinations" title={data.title || "Where the routes lead"} lede={data.lede || undefined} layout="full" aside={<Button href="/pathway-explorer" variant="ghost" arrow="right">Open the Pathway Explorer</Button>}>
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((d, i) => (
          <Reveal key={d.id} delay={i * 40}>
            <DestinationCard destination={d} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

async function TestimonialBlock({ data }: { data: BlockData["TESTIMONIAL"] }) {
  const story = data.storySlug ? await getStudentStoryBySlug(data.storySlug) : null;
  const quote = story?.quote || data.quote;
  const name = story?.studentName || data.name;
  const role = story ? [story.programme?.shortTitle ?? story.programme?.title, story.destination?.country].filter(Boolean).join(" → ") : data.role;
  if (!quote) return null;
  return (
    <section className="container-x py-16">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-1">
          <RouteLine orientation="vertical" className="hidden h-full lg:flex" node="start" />
        </div>
        <blockquote className="lg:col-span-9">
          <p className="font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.15] text-fg text-balance">“{quote}”</p>
          {name ? (
            <footer className="mt-6 text-sm">
              <span className="font-medium text-fg">{name}</span>
              {role ? <span className="text-fg-muted"> — {role}</span> : null}
            </footer>
          ) : null}
        </blockquote>
      </div>
    </section>
  );
}

async function StudentStoryBlock({ data }: { data: BlockData["STUDENT_STORY"] }) {
  const stories = await getStudentStories({ featured: data.featuredOnly, take: data.take });
  return (
    <Section eyebrow="Student stories" title={data.title || "Real journeys"} layout="full" aside={<Button href="/student-stories" variant="ghost" arrow="right">All stories</Button>}>
      {stories.length ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((s, i) => (
            <Reveal key={s.id} delay={i * 40}>
              <StoryCard story={s} />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState title="Student stories are published with consent" body="Stories appear here once students have approved their photography and words." />
      )}
    </Section>
  );
}

async function FaqBlock({ data }: { data: BlockData["FAQ"] }) {
  const faqs = await getFaqs({ category: data.category, programmeSlug: data.programmeSlug });
  if (faqs.length === 0) return null;
  const label = data.category ? FAQ_CATEGORY_LABELS[data.category as FaqCategory] ?? data.category : "Questions";
  return (
    <Section eyebrow="FAQ" title={data.title || label}>
      <Accordion items={faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
      <JsonLd data={faqPageJsonLd(faqs)} />
    </Section>
  );
}

function CtaBlock({ data }: { data: BlockData["CTA"] }) {
  return (
    <section className="container-x py-12">
      <div className="surface-raised flex flex-col gap-6 rounded-[var(--radius-lg)] p-8 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="max-w-xl">
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] text-fg">{data.title}</h2>
          {data.body ? <p className="mt-3 text-fg-muted">{data.body}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button href={data.primaryHref} arrow="right">
            {data.primaryLabel}
          </Button>
          {data.secondaryHref && data.secondaryLabel ? (
            <Button href={data.secondaryHref} variant="secondary">
              {data.secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

async function GalleryBlock({ data }: { data: BlockData["GALLERY"] }) {
  const media = await getApprovedMedia(data.mediaIds);
  const byId = new Map(media.map((m) => [m.id, m]));
  const items = data.mediaIds.length ? data.mediaIds.map((id, i) => ({ key: id, media: byId.get(id) ?? null, slot: data.slots[i] ?? `Gallery ${i + 1}` })) : data.slots.map((slot, i) => ({ key: `slot-${i}`, media: null, slot }));
  if (items.length === 0) return null;
  return (
    <section className="container-x py-12">
      {data.title ? <h2 className="font-display mb-8 text-[clamp(1.75rem,3vw,2.5rem)] text-fg">{data.title}</h2> : null}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-12">
        {items.map((item, i) => (
          <Reveal key={item.key} delay={i * 40} className={i % 3 === 0 ? "lg:col-span-7" : "lg:col-span-5"}>
            <Plate media={item.media} slot={item.slot} aspect={i % 3 === 0 ? "3/2" : "4/3"} sizes="(min-width:1024px) 50vw, 100vw" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ComparisonTableBlock({ data }: { data: BlockData["COMPARISON_TABLE"] }) {
  return (
    <section className="container-x py-12">
      {data.title ? <h2 className="font-display mb-8 text-[clamp(1.75rem,3vw,2.5rem)] text-fg">{data.title}</h2> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[0.9375rem]">
          <thead>
            <tr>
              <th scope="col" className="border-b border-line py-3 pr-4 text-left font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">
                <span className="sr-only">Criterion</span>
              </th>
              {data.columns.map((c) => (
                <th key={c} scope="col" className="border-b border-line py-3 pr-4 text-left font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="border-b border-line py-3 pr-4 text-left font-medium text-fg">
                  {r.label}
                </th>
                {data.columns.map((_, i) => (
                  <td key={i} className="border-b border-line py-3 pr-4 text-fg-muted">
                    {r.values[i] || <span className="text-fg-subtle">Confirmed by the admissions team</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.footnote ? <p className="mt-4 text-sm text-fg-subtle">{data.footnote}</p> : null}
    </section>
  );
}

async function LogoWallBlock({ data }: { data: BlockData["LOGO_WALL"] }) {
  const partners = await getPartners();
  const list = data.featuredOnly ? partners.filter((p) => p.featured) : partners;
  if (list.length === 0) return null;
  return (
    <section className="container-x py-12">
      <p className="eyebrow eyebrow-rule">{data.title || "Global academic network"}</p>
      <ul className="mt-8 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => {
          const logo = p.logo && p.logo.usageStatus === "APPROVED" ? p.logo : null;
          const inner = logo ? <Image src={logo.url} alt={logo.alt || p.name} width={logo.width ?? 160} height={logo.height ?? 48} className="max-h-10 w-auto object-contain opacity-80 transition-opacity group-hover:opacity-100" /> : <span className="font-display text-[1.25rem] text-fg">{p.name}</span>;
          return (
            <li key={p.id} className="bg-bg">
              {p.website ? (
                <a href={p.website} target="_blank" rel="noopener noreferrer" data-analytics="outbound_partner_click" className="group flex h-28 items-center justify-center p-6 text-center">
                  {inner}
                </a>
              ) : (
                <div className="flex h-28 items-center justify-center p-6 text-center">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function QuoteBlock({ data }: { data: BlockData["QUOTE"] }) {
  return (
    <section className="container-x py-16">
      <blockquote className="border-l border-route pl-8 lg:ml-[calc(100%/12*3)]">
        <p className="font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.15] text-fg text-balance">{data.text}</p>
        {data.attribution ? <footer className="mt-5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted">{data.attribution}</footer> : null}
      </blockquote>
    </section>
  );
}

async function MediaBlock({ data }: { data: BlockData["MEDIA"] }) {
  const [media] = await getApprovedMedia([data.mediaId]);
  if (!media) {
    return (
      <section className="container-x py-8">
        <PendingLine>Media is published once approved.</PendingLine>
      </section>
    );
  }
  if (media.kind === "VIDEO") {
    return (
      <section className="container-x py-8">
        <figure>
          <video controls preload="metadata" className="w-full rounded-[var(--radius)] border border-line" src={media.url} aria-label={media.alt || undefined} />
          {(data.caption || media.caption) ? <figcaption className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{data.caption || media.caption}</figcaption> : null}
        </figure>
      </section>
    );
  }
  if (media.kind === "PDF" || media.kind === "DOCUMENT") {
    return (
      <section className="container-x py-8">
        <Link href={media.url} className="inline-flex items-center gap-2 text-brand-soft underline underline-offset-4" target="_blank" rel="noopener noreferrer">
          {data.caption || media.filename}
        </Link>
      </section>
    );
  }
  return (
    <section className="container-x py-8">
      <Plate media={media} slot={media.alt || "Media"} aspect={data.aspect} caption={data.caption || undefined} sizes="(min-width:1320px) 1320px, 100vw" />
    </section>
  );
}
