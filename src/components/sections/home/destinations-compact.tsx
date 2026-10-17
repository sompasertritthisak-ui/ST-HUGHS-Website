import Link from "next/link";
import type { Destination, Media, University } from "@prisma/client";
import type { DestinationWithRelations } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SplitHeading } from "@/components/ui/split-heading";

type UniversityWithRelations = University & { logo?: Media | null; destination?: Destination | null };

/**
 * Act — Destinations, in one screen. The countries as links with their published route counts and
 * the partner universities as a single line. The full departure board lives on /destinations and
 * the university profiles on /universities.
 */
export function DestinationsCompact({ destinations, universities }: { destinations: DestinationWithRelations[]; universities: UniversityWithRelations[] }) {
  return (
    <section aria-labelledby="destinations-title" className="bg-bg text-fg border-t border-line">
      <div className="container-x section-y">
        <div className="grid grid-cols-12 gap-x-8 gap-y-8 lg:items-end">
          <Reveal className="col-span-12 lg:col-span-6">
            <p className="eyebrow eyebrow-rule">Destinations</p>
            <SplitHeading id="destinations-title" text={`${destinations.length} countries.`} accent="One starting point." accentClassName="text-blue" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance" />
          </Reveal>
          <Reveal className="col-span-12 lg:col-span-5 lg:col-start-8" delay={80}>
            <p className="text-lg leading-relaxed text-fg-muted text-pretty">
              Every country below has at least one published route from Vientiane. Progression is subject to each university&rsquo;s entry requirements.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <ul className="flex flex-wrap gap-2.5" aria-label="Destinations">
            {destinations.map((d) => {
              const routes = d.pathways.length;
              return (
                <li key={d.id}>
                  <Link
                    href={`/destinations/${d.slug}`}
                    className="group inline-flex h-12 items-center gap-3 rounded-full border border-line pl-5 pr-2 text-[1rem] text-fg transition-colors duration-[var(--dur-fast)] hover:border-blue hover:bg-blue hover:text-white"
                  >
                    <span className="font-mono text-[0.6875rem] tracking-[0.16em] text-brand-soft group-hover:text-white/80">{d.isoCode}</span>
                    {d.country}
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-bg-hover px-2.5 font-mono text-[0.6875rem] tabular text-fg-muted transition-colors group-hover:bg-white/15 group-hover:text-white">
                      {routes > 0 ? routes : "·"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>

        {universities.length > 0 ? (
          <Reveal className="mt-14 border-t border-line pt-8" delay={120}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-baseline lg:justify-between">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-subtle">Partner universities</p>
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {universities.map((u) => (
                  <li key={u.id}>
                    <Link href={`/universities/${u.slug}`} className="font-display text-[1.375rem] leading-none text-fg transition-colors hover:text-blue">
                      {u.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ) : null}

        <div className="mt-12 flex flex-wrap gap-3">
          <Button href="/destinations" variant="secondary" arrow="right">
            All destinations
          </Button>
          <Button href="/universities" variant="ghost" arrow="right">
            All universities
          </Button>
        </div>
      </div>
    </section>
  );
}
