import Link from "next/link";
import type { Media, University, Destination } from "@prisma/client";
import type { DestinationWithRelations } from "@/lib/content";
import { UniversityCard } from "@/components/cards/university-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { VerificationBadge } from "@/components/ui/verification-badge";

type UniversityWithRelations = University & { logo?: Media | null; destination?: Destination | null };

/** Act VI — Destination. A departure board of countries, then the partner universities. */
export function GlobalNetwork({ destinations, universities }: { destinations: DestinationWithRelations[]; universities: UniversityWithRelations[] }) {
  return (
    <section aria-labelledby="network-title" className="border-y border-line bg-bg-raised">
      <div className="container-x section-y">
        <div className="grid grid-cols-12 gap-x-8 gap-y-8 lg:items-end">
          <Reveal className="col-span-12 lg:col-span-6">
            <p className="eyebrow eyebrow-rule">Destination</p>
            <h2 id="network-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
              Departures from Vientiane
            </h2>
          </Reveal>
          <Reveal className="col-span-12 lg:col-span-5 lg:col-start-8" delay={80}>
            <p className="text-lg leading-relaxed text-fg-muted text-pretty">
              Every country on the board has at least one published route or a partnership in confirmation. Status is shown honestly: confirmed routes and
              routes still being verified are labelled as such.
            </p>
          </Reveal>
        </div>

        {/* Departure board */}
        <div className="mt-14 overflow-x-auto lg:mt-20">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[4rem_1fr_9rem_10rem] gap-x-6 border-b border-line-strong pb-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle md:grid-cols-[5rem_1fr_10rem_11rem]">
              <span>Code</span>
              <span>Destination</span>
              <span className="text-right">Routes</span>
              <span className="text-right">Status</span>
            </div>
            {destinations.length > 0 ? (
              <ol aria-label="Destinations">
                {destinations.map((d, i) => {
                  const routes = d.pathways.length;
                  const verified = d.verificationStatus === "VERIFIED";
                  return (
                    <Reveal as="li" key={d.id} delay={i * 40} className="border-b border-line">
                      <Link
                        href={`/destinations/${d.slug}`}
                        className="group grid grid-cols-[4rem_1fr_9rem_10rem] items-center gap-x-6 py-4 transition-colors hover:bg-bg-hover/30 md:grid-cols-[5rem_1fr_10rem_11rem] md:py-5"
                      >
                        <span className="font-mono text-[0.8125rem] tracking-[0.16em] text-brand-soft">{d.isoCode}</span>
                        <span className="flex min-w-0 flex-wrap items-baseline gap-x-4">
                          <span className="font-display text-[clamp(1.5rem,2.4vw,2.125rem)] leading-none text-fg group-hover:text-brand-soft">{d.country}</span>
                          {d.region ? <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">{d.region}</span> : null}
                        </span>
                        <span className="text-right font-mono text-[0.75rem] uppercase tracking-[0.12em] text-fg-muted tabular">
                          {routes > 0 ? `${String(routes).padStart(2, "0")} published` : "In confirmation"}
                        </span>
                        <span className="flex justify-end">
                          {verified ? (
                            <span className="inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-success">
                              <span aria-hidden className="size-1.5 rounded-full bg-success" />
                              Confirmed
                            </span>
                          ) : (
                            <VerificationBadge status={d.verificationStatus} />
                          )}
                        </span>
                      </Link>
                    </Reveal>
                  );
                })}
              </ol>
            ) : (
              <EmptyState className="mt-6" title="Destinations are being confirmed" body="Countries appear on the board once a route to them is published." />
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">
            Progression to any university is subject to its published entry requirements.
          </p>
          <Button href="/destinations" variant="ghost" arrow="right" className="text-sm">
            All destinations
          </Button>
        </div>

        {/* Universities */}
        <div className="mt-20 border-t border-line pt-14 lg:mt-28 lg:pt-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <p className="eyebrow eyebrow-rule">University network</p>
              <h3 className="font-display mt-5 text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] text-fg">Where routes arrive</h3>
            </Reveal>
            <Button href="/universities" variant="ghost" arrow="right" className="text-sm">
              All universities
            </Button>
          </div>
          {universities.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {universities.map((u, i) => (
                <Reveal key={u.id} delay={i * 40}>
                  <UniversityCard university={u} className="h-full" />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title="Partner universities are being confirmed" body="Universities are listed here once their partnership status has been verified." />
          )}
        </div>
      </div>
    </section>
  );
}
