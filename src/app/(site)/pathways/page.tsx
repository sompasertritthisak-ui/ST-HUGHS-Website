import type { Metadata } from "next";
import Link from "next/link";
import { getPathways, getProgrammes, getDestinations } from "@/lib/content";
import { getPathwaySubjectAreas } from "@/lib/content-pages";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { PathwayCard } from "@/components/cards/pathway-card";
import { Section } from "@/components/pages";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Node } from "@/components/ui/node";

export const metadata: Metadata = pageMetadata({
  title: "Pathways",
  description: "Routes from Vientiane to universities worldwide: start location, duration, transfer point, partner, qualification and progression requirements for every published SHV pathway.",
  path: "/pathways",
});

type Search = Promise<{ programme?: string; destination?: string; subject?: string }>;

const ANATOMY = [
  ["Start location", "Every route begins in Vientiane at SHV."],
  ["Duration", "Total time from the first day at SHV to the degree."],
  ["Transfer", "The point at which you move to the partner: after a foundation year, after Year 1 or after Year 2."],
  ["Partner", "The university or network that receives you."],
  ["Qualification", "The degree awarded at the end of the route."],
  ["Field", "The subject family the route serves."],
  ["Progression requirements", "The grades and English level published for the chosen course."],
  ["Application", "How and when to apply — always beginning with a free consultation."],
] as const;

function FilterGroup({ label, param, options, current, base }: { label: string; param: string; options: { value: string; label: string }[]; current?: string; base: URLSearchParams }) {
  if (options.length === 0) return null;
  const hrefFor = (value?: string) => {
    const q = new URLSearchParams(base);
    if (value) q.set(param, value);
    else q.delete(param);
    const s = q.toString();
    return `/pathways${s ? `?${s}` : ""}#routes`;
  };
  const chip = "inline-flex h-10 items-center rounded-[var(--radius-sm)] border px-3.5 text-sm transition-colors";
  return (
    <div>
      <p className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{label}</p>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href={hrefFor()} className={cn(chip, !current ? "border-route text-gold-soft" : "border-line-strong text-fg-muted hover:border-fg hover:text-fg")} aria-current={!current ? "true" : undefined}>
            All
          </Link>
        </li>
        {options.map((o) => (
          <li key={o.value}>
            <Link href={hrefFor(o.value)} className={cn(chip, current === o.value ? "border-route text-gold-soft" : "border-line-strong text-fg-muted hover:border-fg hover:text-fg")} aria-current={current === o.value ? "true" : undefined}>
              {o.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function PathwaysPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const filters = { programmeSlug: sp.programme || undefined, destinationSlug: sp.destination || undefined, subjectArea: sp.subject || undefined };
  const [pathways, programmes, destinations, subjects, total] = await Promise.all([getPathways(filters), getProgrammes(), getDestinations(), getPathwaySubjectAreas(), getPathways()]);
  const base = new URLSearchParams();
  if (sp.programme) base.set("programme", sp.programme);
  if (sp.destination) base.set("destination", sp.destination);
  if (sp.subject) base.set("subject", sp.subject);
  const filtered = Boolean(sp.programme || sp.destination || sp.subject);

  return (
    <>
      <PageHero
        eyebrow="Pathways"
        title={
          <>
            One start. <span className="italic text-gold-soft">Many routes.</span>
          </>
        }
        lede="A pathway is the whole journey: the programme you complete in Vientiane, the point you transfer, the partner that receives you and the degree you finish with. Every route below is published only once its structure is confirmed."
        aside={
          <dl className="grid grid-cols-2 gap-6 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
            <div>
              <dt className="text-fg-subtle">Published routes</dt>
              <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{total.length}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Origin</dt>
              <dd className="mt-2 normal-case tracking-normal text-fg">Vientiane, Lao PDR</dd>
            </div>
          </dl>
        }
      />

      <Section eyebrow="Anatomy of a route" title="What every pathway tells you" lede="The same eight facts, in the same order, on every route — so two pathways can always be compared side by side." aside={<Button href="/compare" variant="ghost" arrow="right">Compare your options</Button>}>
        <ol className="relative">
          <span aria-hidden className="absolute bottom-5 left-[11px] top-3 w-px bg-route/50" />
          {ANATOMY.map(([label, body], i) => (
            <Reveal key={label} as="li" delay={i * 40} className="relative grid gap-1 pb-7 pl-12 last:pb-0 sm:grid-cols-12 sm:gap-6">
              <Node active={i === 0} className="absolute left-0 top-0" />
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-gold-soft sm:col-span-4">{label}</span>
              <span className="text-[0.9375rem] leading-relaxed text-fg-muted sm:col-span-8">{body}</span>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section id="routes" eyebrow="Published routes" title={filtered ? `${pathways.length} matching route${pathways.length === 1 ? "" : "s"}` : "All published routes"} layout="full" aside={<Button href="/pathway-explorer" variant="ghost" arrow="right">Open the interactive Pathway Explorer</Button>}>
        <div className="mb-12 grid gap-8 border-y border-line py-8 lg:grid-cols-3">
          <FilterGroup label="Programme" param="programme" options={programmes.map((p) => ({ value: p.slug, label: p.shortTitle ?? p.title }))} current={sp.programme} base={base} />
          <FilterGroup label="Destination" param="destination" options={destinations.map((d) => ({ value: d.slug, label: d.country }))} current={sp.destination} base={base} />
          <FilterGroup label="Subject" param="subject" options={subjects.map((s) => ({ value: s, label: s }))} current={sp.subject} base={base} />
        </div>
        {pathways.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pathways.map((p, i) => (
              <Reveal key={p.id} delay={i * 40}>
                <PathwayCard pathway={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="No published route matches this combination yet" body="Routes are published as their structures are confirmed with partners. An advisor can tell you what is possible for your case." action={<Button href="/pathways" variant="secondary">Clear filters</Button>} />
        )}
      </Section>

      <ConsultationBand title="Which route is right for you?" body="Explore the universities each route leads to, or book a free consultation and we will map the options against your qualifications." primaryHref="/universities" primaryLabel="Explore universities" secondaryHref="/consultation" secondaryLabel="Book a consultation" />
    </>
  );
}
