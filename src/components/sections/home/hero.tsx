import { Button } from "@/components/ui/button";
import { GlobeStage } from "@/components/three/globe-stage";
import { ORIGIN, type GlobeDestination } from "@/components/three/geo";
import type { MessagingSettings } from "@/lib/content";

const WORD_BASE_DELAY = 480; // let the loading plate begin to dissolve first
const WORD_STAGGER = 40;

function Words({ text, offset = 0, className }: { text: string; offset?: number; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.06em] align-baseline">
            <span className="anim-fade-up inline-block" style={{ animationDelay: `${WORD_BASE_DELAY + (offset + i) * WORD_STAGGER}ms` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

export function Hero({
  messaging,
  destinations,
  routeCount,
  established,
}: {
  messaging: MessagingSettings;
  destinations: GlobeDestination[];
  routeCount: number;
  established: number;
}) {
  const line1Words = messaging.heroLine1.split(/\s+/).filter(Boolean).length;
  const supportDelay = WORD_BASE_DELAY + (line1Words + messaging.heroLine2.split(/\s+/).length) * WORD_STAGGER + 120;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Globe — behind and to the right on large screens; a map band on small screens */}
      <div className="pointer-events-none absolute inset-y-0 right-[-3vw] hidden w-[56vw] max-w-[960px] items-center lg:flex" aria-hidden>
        <div className="absolute inset-y-0 left-0 z-10 w-1/3 bg-linear-to-r from-bg to-transparent" />
        <GlobeStage destinations={destinations} className="aspect-square w-full" />
      </div>

      <div className="container-x relative grid min-h-[calc(100dvh-72px)] grid-cols-12 content-center gap-y-12 pb-16 pt-12 lg:pb-24 lg:pt-16">
        <div className="relative z-10 col-span-12 lg:col-span-7">
          <p className="eyebrow eyebrow-rule anim-fade-up" style={{ animationDelay: "320ms" }}>
            St Hugh&rsquo;s College Vientiane · NCUK Study Centre · Est. {established}
          </p>
          <h1 id="hero-title" className="font-display mt-8 text-[clamp(2.75rem,9.2vw,8.5rem)] leading-[0.94] text-fg">
            <Words text={messaging.heroLine1} className="block" />
            <Words text={messaging.heroLine2} offset={line1Words} className="block text-gold-soft" />
          </h1>
          <p className="anim-fade-up mt-8 max-w-xl text-lg leading-relaxed text-fg-muted text-pretty md:text-xl" style={{ animationDelay: `${supportDelay}ms` }}>
            {messaging.heroSupport}
          </p>
          <div className="anim-fade-up mt-10 flex flex-wrap items-center gap-x-5 gap-y-4" style={{ animationDelay: `${supportDelay + 120}ms` }}>
            <Button href="/pathway-explorer" size="lg" arrow="right">
              Explore your pathway
            </Button>
            <Button href="/consultation" variant="secondary" size="lg">
              Talk to an advisor
            </Button>
            <Button href="/programmes" variant="ghost" arrow="right" className="text-[0.9375rem]">
              Explore programmes
            </Button>
          </div>
        </div>

        {/* Small-screen map */}
        <div className="col-span-12 lg:hidden" aria-hidden>
          <GlobeStage destinations={destinations} className="aspect-[2/1] w-full" webgl={false} />
        </div>

        {/* Wayfinding strip */}
        <div className="anim-fade-up relative z-10 col-span-12 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-line pt-5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle lg:col-span-7" style={{ animationDelay: `${supportDelay + 300}ms` }}>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-1.5 rounded-full bg-route shadow-[0_0_10px_var(--route)]" />
            Origin · {ORIGIN.label} {ORIGIN.lat.toFixed(2)}° N, {ORIGIN.lng.toFixed(2)}° E
          </span>
          <span>
            {destinations.length} destination{destinations.length === 1 ? "" : "s"} · {routeCount} published route{routeCount === 1 ? "" : "s"}
          </span>
          <span className="ml-auto hidden text-gold-soft sm:inline">{messaging.tagline}</span>
        </div>
      </div>
    </section>
  );
}
