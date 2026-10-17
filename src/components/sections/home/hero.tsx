import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { GlobeStage } from "@/components/three/globe-stage";
import { ORIGIN, type GlobeDestination } from "@/components/three/geo";
import type { MessagingSettings } from "@/lib/content";
import { HeroMotion } from "./hero-motion";

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
    <section aria-labelledby="hero-title" className="bg-bg text-fg relative overflow-hidden">
      <HeroMotion />
      {/* Soft blue atmosphere behind the globe so the white field has depth without a dark ground */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[-10vw] z-0 hidden w-[70vw] bg-[radial-gradient(ellipse_at_center,rgb(16_48_144/0.14)_0%,rgb(16_48_144/0.05)_38%,transparent_62%)] lg:block" />
      {/* Globe — the visual centre: ~60vw, right-anchored, vertically centred, bleeding ~8vw past the edge.
          Interactive (drag / click) wherever the copy column does not sit above it. */}
      <div data-hero-globe className="absolute inset-y-0 right-[-8vw] z-[1] hidden w-[min(60vw,calc(100dvh-72px))] items-center lg:flex" aria-hidden>
        {/* Left-third fade keeps the headline ≥ 4.5:1 over the globe */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 bg-linear-to-r from-bg to-transparent" />
        <GlobeStage destinations={destinations} className="aspect-square w-full" tone="light" media="(min-width: 1024px)" />
      </div>

      <div className="container-x relative grid min-h-[calc(100dvh-72px-3.25rem)] grid-cols-12 content-center gap-y-12 pb-12 pt-10 lg:pb-14 lg:pt-12">
        <div data-hero-copy className="relative z-10 col-span-12 lg:col-span-7">
          <p className="eyebrow eyebrow-rule anim-fade-up" style={{ animationDelay: "320ms" }}>
            St Hugh&rsquo;s College Vientiane · NCUK Study Centre · Est. {established}
          </p>
          <h1 id="hero-title" className="font-display mt-8 text-[clamp(2.75rem,9.2vw,8.5rem)] leading-[0.94] text-fg">
            <Words text={messaging.heroLine1} className="block" />
            <Words text={messaging.heroLine2} offset={line1Words} className="block" />
            <span aria-hidden className="anim-fade-up mt-5 block h-1 w-36 origin-left bg-route" style={{ animationDelay: `${supportDelay}ms` }} />
          </h1>
          <p className="anim-fade-up mt-8 max-w-xl text-lg leading-relaxed text-fg-muted text-pretty md:text-xl" style={{ animationDelay: `${supportDelay}ms` }}>
            {messaging.heroSupport}
          </p>
          <div className="anim-fade-up mt-10 flex flex-wrap items-center gap-x-5 gap-y-4" style={{ animationDelay: `${supportDelay + 120}ms` }}>
            <Magnetic>
              <Button href="/pathway-explorer" size="lg" arrow="right">
                Explore your pathway
              </Button>
            </Magnetic>
            <Button href="/consultation" variant="secondary" size="lg">
              Talk to an advisor
            </Button>
            <Button href="/programmes" variant="ghost" arrow="right" className="text-[0.9375rem]">
              Explore programmes
            </Button>
          </div>
          <p className="anim-fade-up mt-6 hidden font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle lg:block" style={{ animationDelay: `${supportDelay + 240}ms` }}>
            Drag the globe · Click a destination
          </p>
          <span aria-hidden className="scroll-cue anim-fade-up mt-8 hidden lg:block" style={{ animationDelay: `${supportDelay + 400}ms` }} />
        </div>

        {/* Small and medium screens: the same interactive Earth, below the copy */}
        <div className="col-span-12 lg:hidden" aria-hidden>
          <div className="relative mx-auto w-full max-w-[640px]">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(16_48_144/0.14)_0%,rgb(16_48_144/0.05)_40%,transparent_64%)]" />
            <GlobeStage destinations={destinations} className="aspect-square w-full" tone="light" media="(max-width: 1023.98px)" />
          </div>
        </div>

      </div>

      {/* Wayfinding band — the flag's red stripe under the blue field */}
      <div className="theme-brand bg-bg text-fg anim-fade-up relative z-10" style={{ animationDelay: `${supportDelay + 300}ms` }}>
        <div className="container-x flex flex-wrap items-center gap-x-8 gap-y-2 py-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted">
          <span className="inline-flex items-center gap-2 text-fg">
            <span aria-hidden className="size-1.5 rounded-full bg-route shadow-[0_0_10px_var(--route)]" />
            Origin · {ORIGIN.label} {ORIGIN.lat.toFixed(2)}° N, {ORIGIN.lng.toFixed(2)}° E
          </span>
          <span>
            {destinations.length} destination{destinations.length === 1 ? "" : "s"} · {routeCount} published route{routeCount === 1 ? "" : "s"}
          </span>
          <span className="ml-auto hidden text-fg sm:inline">{messaging.tagline}</span>
        </div>
      </div>
    </section>
  );
}
