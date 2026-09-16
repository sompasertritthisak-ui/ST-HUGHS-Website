import type { Facility, Media } from "@prisma/client";
import { FACILITY_CATEGORY_LABELS, type FacilityCategory } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plate } from "@/components/ui/plate";
import { Reveal } from "@/components/ui/reveal";
import { RouteLine } from "@/components/ui/route-line";
import { DragScroll } from "@/components/ui/drag-scroll";

type FacilityWithPhoto = Facility & { photo?: Media | null };

const ASPECTS = ["4/3", "3/4", "16/9", "3/2", "1/1"] as const;
const WIDTHS = ["w-[min(78vw,560px)]", "w-[min(62vw,380px)]", "w-[min(86vw,720px)]", "w-[min(72vw,520px)]", "w-[min(60vw,420px)]"] as const;

/**
 * Act VIII — Campus. A cinematic horizontal strip along the gold line: each
 * plate is a real photograph or a named photography slot. Drag-to-scroll strip.
 */
export function CampusStrip({ facilities: input, addressLine }: { facilities: FacilityWithPhoto[]; addressLine?: string }) {
  // Real photography leads the walk; named plates for spaces still to be photographed follow.
  const facilities = [...input].sort((a, b) => Number(Boolean(b.photo && b.photo.usageStatus === "APPROVED")) - Number(Boolean(a.photo && a.photo.usageStatus === "APPROVED")));
  const photographed = facilities.filter((f) => f.photo && f.photo.usageStatus === "APPROVED").length;
  return (
    <section aria-labelledby="campus-title" className="theme-light bg-bg text-fg relative border-t border-line">
      <div className="container-x pt-[var(--section-y)]">
        <div className="grid grid-cols-12 gap-x-8 gap-y-6 lg:items-end">
          <Reveal className="col-span-12 lg:col-span-6">
            <p className="eyebrow eyebrow-rule">Campus{addressLine ? ` · ${addressLine}` : " · Vientiane"}</p>
            <h2 id="campus-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
              The campus, room by room
            </h2>
          </Reveal>
          <Reveal className="col-span-12 flex flex-wrap items-center justify-between gap-6 lg:col-span-5 lg:col-start-8" delay={80}>
            <p className="max-w-md text-lg leading-relaxed text-fg-muted text-pretty">
              {photographed > 0
                ? `${photographed} of ${facilities.length} spaces photographed so far. Drag to walk the campus; each remaining plate names the view it will hold.`
                : "Photography of the campus is being commissioned. Each plate names the view it will hold, so the sequence is already the tour."}
            </p>
            <Button href="/campus" variant="ghost" arrow="right" className="text-sm">
              Visit the campus page
            </Button>
          </Reveal>
        </div>
      </div>

      {/* The line the strip travels along */}
      <div className="container-x mt-12">
        <RouteLine node="both" />
      </div>

      {facilities.length > 0 ? (
        <div className="relative mt-8 pb-[var(--section-y)]">
          <DragScroll ariaLabel="Campus spaces" className="relative">
          <ol className="flex snap-x gap-6 px-[var(--gutter)] md:gap-8 [&>li]:snap-start">
            {facilities.map((f, i) => {
              const aspect = ASPECTS[i % ASPECTS.length];
              const width = WIDTHS[i % WIDTHS.length];
              const category = FACILITY_CATEGORY_LABELS[f.category as FacilityCategory] ?? f.category;
              return (
                <li key={f.id} className={`shrink-0 snap-start ${width} ${i % 2 === 1 ? "md:mt-12" : ""}`}>
                  <Reveal delay={Math.min(i, 4) * 40}>
                    <Plate media={f.photo} slot={`Campus — ${f.name}`} aspect={aspect} sizes="(min-width:1024px) 40vw, 80vw" />
                    <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">
                          <span className="tabular text-brand-soft">{String(i + 1).padStart(2, "0")}</span>
                          <span className="mx-2">/</span>
                          <span className="tabular">{String(facilities.length).padStart(2, "0")}</span>
                          <span className="ml-3">{category}</span>
                        </p>
                        <h3 className="mt-2 text-[1.125rem] font-medium text-fg">{f.name}</h3>
                        {f.description ? <p className="mt-1 text-[0.9375rem] leading-relaxed text-fg-muted">{f.description}</p> : null}
                      </div>
                    </div>
                  </Reveal>
                </li>
              );
            })}
            <li aria-hidden className="w-[var(--gutter)] shrink-0" />
          </ol>
          </DragScroll>
          <p className="container-x mt-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">Drag or scroll sideways to walk the campus →</p>
        </div>
      ) : (
        <div className="container-x pb-[var(--section-y)] pt-10">
          <EmptyState title="Campus spaces are being documented" body="Facilities appear here once published in the CMS." />
        </div>
      )}
    </section>
  );
}
