"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type ShowcaseItem = {
  slug: string;
  title: string;
  typeLabel: string;
  awardingBody: string | null;
  summary: string;
  durationLabel: string | null;
  englishRequirement: string | null;
  qualification: string | null;
  image: { url: string; alt: string; focalX: number; focalY: number } | null;
};

const AUTOPLAY_MS = 6500;

/**
 * Interactive programme showcase: a tab list of programmes on the left drives a
 * cross-fading photograph and fact panel on the right. Auto-advances until the
 * visitor interacts; keyboard accessible (WAI-ARIA tabs pattern).
 */
export function ProgrammeShowcase({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const reduced = useReducedMotion();
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (paused || reduced || items.length < 2) return;
    const t = window.setTimeout(() => {
      setActive((a) => (a + 1) % items.length);
      setCycle((c) => c + 1);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, reduced, items.length, cycle]);

  const select = (i: number) => {
    setActive(i);
    setPaused(true);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (active + dir + items.length) % items.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  const current = items[active];
  if (!current) return null;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Tabs */}
      <div role="tablist" aria-orientation="vertical" aria-label="Programmes" className="lg:col-span-5" onKeyDown={onKey}>
        {items.map((it, i) => {
          const selected = i === active;
          return (
            <button
              key={it.slug}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              onFocus={() => setPaused(true)}
              className={cn(
                "group relative flex w-full items-start gap-5 border-t border-line py-5 text-left transition-colors duration-[var(--dur)]",
                selected ? "text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              <span aria-hidden className={cn("absolute inset-y-3 left-0 w-[3px] origin-top bg-route transition-transform duration-[var(--dur)] ease-[var(--ease-out)]", selected ? "scale-y-100" : "scale-y-0")} />
              <span className="mt-1 w-8 shrink-0 pl-4 font-mono text-[0.6875rem] tracking-[0.14em] text-fg-subtle tabular">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">
                  {it.typeLabel}
                  {it.awardingBody ? <span className="text-fg-subtle/70"> · {it.awardingBody}</span> : null}
                </span>
                <span className={cn("mt-1 block font-display leading-[1.05] text-balance transition-[font-size] duration-[var(--dur)]", selected ? "text-[clamp(1.5rem,2.2vw,2rem)]" : "text-[1.25rem]")}>{it.title}</span>
              </span>
              {/* autoplay progress */}
              {selected && !paused && !reduced && items.length > 1 ? (
                <span aria-hidden className="absolute bottom-0 left-0 h-px w-full overflow-hidden">
                  <span key={cycle} className="block h-full origin-left bg-route" style={{ animation: `shv-progress ${AUTOPLAY_MS}ms linear forwards` }} />
                </span>
              ) : null}
            </button>
          );
        })}
        <div className="border-t border-line" />
        <style>{`@keyframes shv-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
      </div>

      {/* Panel */}
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active}`} className="lg:col-span-7">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] border border-line bg-bg-hover">
          {items.map((it, i) =>
            it.image ? (
              <Image
                key={it.slug}
                src={it.image.url}
                alt={i === active ? it.image.alt : ""}
                fill
                sizes="(min-width:1024px) 55vw, 100vw"
                priority={i === 0}
                className={cn("object-cover transition-[opacity,transform] duration-[900ms] ease-[var(--ease-out)]", i === active ? "opacity-100 scale-100" : "opacity-0 scale-[1.03]")}
                style={{ objectPosition: `${Math.round(it.image.focalX * 100)}% ${Math.round(it.image.focalY * 100)}%` }}
                aria-hidden={i !== active}
              />
            ) : (
              <div key={it.slug} aria-hidden={i !== active} className={cn("absolute inset-0 flex items-end p-5 transition-opacity duration-[600ms]", i === active ? "opacity-100" : "opacity-0")}>
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">Photography plate — {it.title}</span>
              </div>
            ),
          )}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-midnight/60 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-white">
            <span className="size-1.5 rounded-full bg-route shadow-[0_0_10px_var(--route)]" />
            {current.typeLabel}
          </div>
        </div>

        <div key={current.slug} className="anim-fade-up mt-6 grid gap-6 md:grid-cols-12">
          <p className="text-[1.0625rem] leading-relaxed text-fg-muted md:col-span-7">{current.summary}</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 font-mono text-[0.6875rem] uppercase tracking-[0.12em] md:col-span-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="col-span-2">
              <dt className="text-fg-subtle">Duration</dt>
              <dd className="mt-1 normal-case tracking-normal text-fg">{current.durationLabel ?? "Confirmed per intake"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-fg-subtle">English</dt>
              <dd className="mt-1 normal-case tracking-normal text-fg">{current.englishRequirement ? current.englishRequirement.split(/[.(—–]/)[0].trim() : "Confirmed per intake"}</dd>
            </div>
            {current.qualification ? (
              <div className="col-span-2">
                <dt className="text-fg-subtle">Leads to</dt>
                <dd className="mt-1 normal-case tracking-normal text-fg">{current.qualification}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href={`/programmes/${current.slug}`} className="group inline-flex h-12 items-center gap-2 rounded-[var(--radius-sm)] bg-brand px-6 text-[0.9375rem] font-medium text-white hover:bg-brand-deep">
            View programme
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
          </Link>
          <Link href={`/pathway-finder`} className="inline-flex h-12 items-center rounded-[var(--radius-sm)] border border-line-strong px-6 text-[0.9375rem] text-fg hover:border-fg">
            Check your eligibility
          </Link>
        </div>
      </div>
    </div>
  );
}
