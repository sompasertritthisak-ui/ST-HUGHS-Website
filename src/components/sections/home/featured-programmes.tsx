import type { Media, Programme } from "@prisma/client";
import { PROGRAMME_TYPE_LABELS, type ProgrammeType } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { ProgrammeShowcase, type ShowcaseItem } from "./programme-showcase";

type ProgrammeWithHero = Programme & { heroMedia?: Media | null };

/** Act V — Foundation. An interactive showcase of the programmes taught at the origin node. */
export function FeaturedProgrammes({ programmes }: { programmes: ProgrammeWithHero[] }) {
  const items: ShowcaseItem[] = programmes.map((p) => ({
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
            <p className="eyebrow eyebrow-rule">Foundation</p>
            <h2 id="programmes-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
              Taught in Vientiane. Recognised by universities abroad.
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={80}>
            <p className="text-lg leading-relaxed text-fg-muted text-pretty">
              Each programme is a first step on a route, not a course in isolation. Choose one to see where it leads.
            </p>
            <div className="mt-4">
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
