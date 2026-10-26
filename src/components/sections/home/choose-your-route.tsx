import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SplitHeading } from "@/components/ui/split-heading";

export type RouteLogo = { slug: string; logo?: string | null };

/**
 * "Choose your route to a university degree" (management feedback, Dennis — mandatory). Six real routes, each with
 * the partner's logo from the CMS (CMS → Universities → Logo) or, until one is uploaded, a clean wordmark.
 * Phones: compact horizontal cards so all six fit in a few thumb-scrolls.
 */
const ROUTES = [
  { n: "01", kind: "International pathway", title: "NCUK University Pathways", body: "Check entry requirements, understand the International Foundation Year and build a shortlist from 100+ universities.", href: "/programmes/ncuk-international-foundation-year", uni: "ncuk-university-partners", wordmark: { main: "NCUK", sub: "University pathways" } },
  { n: "02", kind: "Study in Laos", title: "St Hugh’s Bachelor courses", body: "A three-year bachelor’s degree taught in Lao on our Vientiane campus, with English and internships built in.", href: "/programmes/bba-entrepreneurship-innovation-gen-ai", logo: "/brand/shv-mark.png" },
  { n: "03", kind: "Vietnam pathway", title: "British University Vietnam", body: "Two years at St Hugh’s, then two years at BUV in Hanoi: Bachelor in International Hospitality Management (2+2).", href: "/programmes/bachelor-international-hospitality-management", uni: "british-university-vietnam", wordmark: { main: "BUV", sub: "British University Vietnam" } },
  { n: "04", kind: "Thailand pathway", title: "Assumption University", body: "One year at St Hugh’s, then three in Bangkok: a bachelor’s and a master’s in four years (1+3).", href: "/programmes/bachelor-master-pathway-assumption-university", uni: "assumption-university" },
  { n: "05", kind: "France pathway", title: "ESDES Business School", body: "The Foundation Year at St Hugh’s, then three years in Lyon: Bachelor in International Business (1+3).", href: "/programmes/bachelor-international-business-esdes", uni: "esdes-lyon-business-school" },
  { n: "06", kind: "Fast track", title: "NCUK International Year One", body: "Already finished a foundation year, A Levels or IB? Study the first year of a business degree here, then join Year 2 abroad.", href: "/programmes/ncuk-international-year-one-business-management", uni: "ncuk-university-partners", wordmark: { main: "NCUK", sub: "International Year One" } },
] as const;

function Mark({ logo, wordmark, title }: { logo?: string | null; wordmark?: { main: string; sub: string }; title: string }) {
  if (logo) {
    // Fit inside the slot: wide logos (NCUK, BUV) shrink to the slot's width instead of spilling under the title.
    // eslint-disable-next-line @next/next/no-img-element -- partner logos of mixed shapes
    return <img src={logo} alt={`${title} logo`} className="block h-auto max-h-14 w-auto max-w-full object-contain sm:max-h-20 sm:max-w-[9rem]" />;
  }
  return (
    <span className="flex flex-col items-center leading-none" aria-label={title}>
      <span className="font-sans text-[1.75rem] font-extrabold tracking-[-0.02em] text-brand sm:text-[2.5rem]">{wordmark?.main ?? title}</span>
      {wordmark?.sub ? <span className="mt-1 font-mono max-sm:hidden text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand">{wordmark.sub}</span> : null}
    </span>
  );
}

export function ChooseYourRoute({ logos }: { logos: RouteLogo[] }) {
  const logoFor = (slug?: string) => (slug ? logos.find((l) => l.slug === slug)?.logo ?? null : null);
  return (
    <section aria-labelledby="routes-title" className="border-t border-line bg-bg text-fg">
      <div className="container-x section-y">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow eyebrow-rule">Study routes</p>
            <SplitHeading id="routes-title" text="Choose your route to a" accent="university degree." accentClassName="text-blue" className="font-display mt-6 text-[clamp(2.25rem,4.8vw,4rem)] leading-[1.02] text-fg text-balance" />
          </Reveal>
          <Reveal className="lg:col-span-5" delay={80}>
            <p className="max-w-md text-[1.0625rem] leading-relaxed text-fg-muted text-pretty lg:ml-auto">
              Compare six routes across Laos and abroad. See where each one begins, where it can lead and which fits your goals.
            </p>
          </Reveal>
        </div>

        <ol className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {ROUTES.map((r, i) => {
            const logo = "logo" in r ? r.logo : logoFor("uni" in r ? r.uni : undefined);
            return (
              <Reveal key={r.n} as="li" delay={(i % 3) * 60} className="bg-bg">
                <Link href={r.href} className="group relative flex h-full items-center gap-4 px-5 py-4 transition-colors sm:items-stretch hover:bg-bg-hover sm:flex-col sm:gap-0 sm:p-7">
                  <span className="absolute right-5 top-4 font-display text-[1rem] text-fg-subtle tabular sm:right-7 sm:top-6">{r.n}</span>
                  <span className="flex w-24 min-w-0 shrink-0 items-center justify-center overflow-hidden sm:mb-6 sm:mt-6 sm:h-24 sm:w-full sm:overflow-visible">
                    <Mark logo={logo} wordmark={"wordmark" in r ? r.wordmark : undefined} title={r.title} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-brand">{r.kind}</span>
                    <span className="mt-1.5 block font-display text-[1.375rem] leading-tight text-fg sm:text-[1.625rem]">{r.title}</span>
                    <span className="mt-2 block text-[0.875rem] leading-relaxed text-fg-muted max-sm:hidden">{r.body}</span>
                    <span className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[0.875rem] font-semibold text-fg sm:mt-6 sm:pt-4">
                      Explore pathway
                      <ArrowUpRight aria-hidden className="size-4 text-fg-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-route" strokeWidth={1.75} />
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
