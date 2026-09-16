import type { Metadata } from "next";
import Link from "next/link";
import { getDestinations } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { DestinationCard } from "@/components/cards/destination-card";
import { Section } from "@/components/pages";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = pageMetadata({
  title: "Destinations",
  description: "Where SHV pathways can lead: the countries with published routes from Vientiane, grouped by region, each with universities, requirements and an official source.",
  path: "/destinations",
});

const ORIGIN = { lat: 17.9757, lng: 102.6331 };
const W = 1000;
const H = 480;
const project = (lat: number, lng: number) => ({ x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H });

/** Static SVG index of destinations plotted from their stored coordinates. The interactive map lives in the Pathway Explorer. */
function DestinationIndex({ destinations }: { destinations: { slug: string; country: string; isoCode: string; lat: number; lng: number; verificationStatus: string }[] }) {
  const o = project(ORIGIN.lat, ORIGIN.lng);
  return (
    <figure className="overflow-hidden rounded-[var(--radius)] border border-line bg-bg-raised">
      <svg viewBox={`0 ${H * 0.08} ${W} ${H * 0.72}`} role="img" aria-labelledby="dest-index-title dest-index-desc" className="block h-auto w-full text-fg-subtle">
        <title id="dest-index-title">Destination index</title>
        <desc id="dest-index-desc">Routes drawn from Vientiane to {destinations.length} destination countries with published pathways.</desc>
        <defs>
          <pattern id="dest-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#dest-grid)" />
        {destinations.map((d) => {
          const p = project(d.lat, d.lng);
          const cx = (o.x + p.x) / 2;
          const cy = Math.min(o.y, p.y) - Math.abs(p.x - o.x) * 0.18;
          return <path key={d.slug} d={`M${o.x},${o.y} Q${cx},${cy} ${p.x},${p.y}`} fill="none" stroke="var(--route)" strokeWidth="0.9" strokeOpacity={d.verificationStatus === "VERIFIED" ? 0.7 : 0.35} strokeDasharray={d.verificationStatus === "VERIFIED" ? undefined : "3 4"} />;
        })}
        {destinations.map((d) => {
          const p = project(d.lat, d.lng);
          const right = p.x > o.x;
          return (
            <a key={d.slug} href={`/destinations/${d.slug}`} aria-label={`${d.country} — view destination`}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="var(--route)" />
              <text x={p.x + (right ? 8 : -8)} y={p.y + 3.5} textAnchor={right ? "start" : "end"} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.5" fill="var(--color-brand-soft)">
                {d.isoCode}
              </text>
            </a>
          );
        })}
        <circle cx={o.x} cy={o.y} r="10" fill="none" stroke="var(--route)" strokeWidth="0.8" opacity="0.7" />
        <circle cx={o.x} cy={o.y} r="4" fill="var(--route)" />
        <text x={o.x} y={o.y + 24} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.5" fill="var(--color-ivory)">
          VIENTIANE
        </text>
      </svg>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">
        <span>Solid line: verified route · Dashed: verification pending</span>
        <Link href="/pathway-explorer" className="text-brand-soft hover:text-fg">
          Interactive map in the Pathway Explorer →
        </Link>
      </figcaption>
    </figure>
  );
}

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  const regions = Array.from(new Set(destinations.map((d) => d.region ?? "Other")));

  return (
    <>
      <PageHero
        eyebrow="Destinations"
        title={
          <>
            From Vientiane <span className="italic text-brand-soft">outward.</span>
          </>
        }
        lede="Every destination below has at least one pathway attached, or is being confirmed. We show only the routes that actually lead to each country — no programme leads everywhere."
        aside={
          <dl className="grid grid-cols-2 gap-6 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
            <div>
              <dt className="text-fg-subtle">Destinations</dt>
              <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{destinations.length}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Regions</dt>
              <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{regions.length}</dd>
            </div>
          </dl>
        }
      />

      {destinations.length ? (
        <section aria-label="Destination index" className="container-x pb-8">
          <Reveal>
            <DestinationIndex destinations={destinations} />
          </Reveal>
        </section>
      ) : null}

      {destinations.length ? (
        regions.map((region) => {
          const items = destinations.filter((d) => (d.region ?? "Other") === region);
          return (
            <Section key={region} id={`region-${region.toLowerCase().replace(/\s+/g, "-")}`} eyebrow="Region" title={region} layout="full">
              <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((d, i) => (
                  <Reveal key={d.id} delay={i * 40}>
                    <DestinationCard destination={d} />
                  </Reveal>
                ))}
              </div>
            </Section>
          );
        })
      ) : (
        <section className="container-x py-16">
          <EmptyState title="Destinations are published as routes are confirmed" />
        </section>
      )}

      <section className="container-x py-6">
        <Button href="/universities" variant="ghost" arrow="right">
          See the universities in each destination
        </Button>
      </section>

      <ConsultationBand title="Which destination fits your plan?" body="Trace a full route in the Pathway Explorer, or book a free consultation and an advisor will match destinations to your subject and qualifications." primaryHref="/pathway-explorer" primaryLabel="Explore your pathway" secondaryHref="/consultation" secondaryLabel="Book a consultation" />
    </>
  );
}
