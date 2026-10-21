import type { Media, Programme } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PROGRAMME_TYPE_LABELS, type ProgrammeType } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { SplitHeading } from "@/components/ui/split-heading";
import { ProgrammeShowcase, type ShowcaseItem } from "./programme-showcase";

type ProgrammeWithHero = Programme & { heroMedia?: Media | null };

/** Act V — Foundation. An interactive showcase of the programmes taught at the origin node. */
/** First sentence only — the landing page shows the essentials, the programme page carries the detail. */
function firstSentence(text: string | null) {
  if (!text) return null;
  const m = text.match(/^[^.!?]+[.!?]/);
  return (m ? m[0] : text).trim();
}

export async function FeaturedProgrammes({ programmes }: { programmes: ProgrammeWithHero[] }) {
  const modules = programmes.length
    ? await prisma.programmeModule.findMany({ where: { programmeId: { in: programmes.map((p) => p.id) } }, orderBy: { order: "asc" }, select: { programmeId: true, title: true } })
    : [];
  const routes = programmes.length
    ? await prisma.pathway.findMany({
        where: { status: "PUBLISHED", programmeId: { in: programmes.map((p) => p.id) } },
        select: { programmeId: true, structureLabel: true, university: { select: { name: true, slug: true, logo: { select: { url: true, alt: true } } } }, destination: { select: { country: true } } },
      })
    : [];
  const items: ShowcaseItem[] = programmes.map((p) => ({
    leadsTo: Array.from(
      new Map(
        routes
          .filter((r) => r.programmeId === p.id && r.university)
          .map((r) => [r.university!.slug, { label: `${r.university!.name}${r.destination ? `, ${r.destination.country}` : ""}`, structure: r.structureLabel, href: `/universities/${r.university!.slug}`, logo: r.university!.logo?.url ?? null }]),
      ).values(),
    ).slice(0, 4),
    modules: modules.filter((m) => m.programmeId === p.id).map((m) => m.title.replace(/\s*\([^)]*\)\s*$/, "").trim()).slice(0, 6),
    assessment: firstSentence(p.assessment),
    slug: p.slug,
    title: p.shortTitle ?? p.title,
    typeLabel: PROGRAMME_TYPE_LABELS[p.type as ProgrammeType] ?? p.type,
    awardingBody: p.awardingBody,
    summary: p.summary,
    durationLabel: p.durationLabel,
    englishRequirement: p.englishRequirement,
    qualification: p.qualification,
    image:
      p.heroMedia && p.heroMedia.usageStatus === "APPROVED"
        ? { url: p.heroMedia.url, alt: p.heroMedia.alt, focalX: p.heroMedia.focalX, focalY: p.heroMedia.focalY }
        : null,
  }));

  return (
    <section aria-labelledby="programmes-title" className="theme-light bg-bg text-fg border-t border-line">
      <div className="container-x section-y">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow eyebrow-rule">Programmes</p>
            <SplitHeading id="programmes-title" text="Taught in Vientiane." accent="Recognised by universities abroad." accentClassName="text-blue" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance" />
          </Reveal>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={80}>
            <div className="lg:text-right">
              <Button href="/programmes" variant="ghost" arrow="right">
                All programmes
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-14" delay={120}>
          {items.length > 0 ? <ProgrammeShowcase items={items} /> : <EmptyState title="Programmes are being finalised" body="Programmes appear here once approved and published in the CMS." />}
        </Reveal>
      </div>
    </section>
  );
}
