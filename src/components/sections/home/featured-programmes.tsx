import type { Programme } from "@prisma/client";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";

/** Act V — Foundation. The programmes taught at the origin node. */
export function FeaturedProgrammes({ programmes }: { programmes: Programme[] }) {
  return (
    <section aria-labelledby="programmes-title" className="border-t border-line">
      <div className="container-x section-y grid grid-cols-12 gap-x-8 gap-y-14">
        <div className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <p className="eyebrow eyebrow-rule">Foundation</p>
              <h2 id="programmes-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
                Taught in Vientiane. Recognised by universities abroad.
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted text-pretty">
                Each programme is a first step on a route, not a course in isolation. Entry requirements, structure and progression are published per programme.
              </p>
              <div className="mt-8">
                <Button href="/programmes" variant="ghost" arrow="right">
                  All programmes
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          {programmes.length > 0 ? (
            <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
              {programmes.map((p, i) => (
                <Reveal key={p.id} delay={i * 40} className={i % 2 === 1 ? "md:mt-16" : undefined}>
                  <ProgrammeCard programme={p} index={i} className="h-full" />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title="Programmes are being finalised" body="Programmes appear here once approved and published in the CMS." />
          )}
        </div>
      </div>
    </section>
  );
}
