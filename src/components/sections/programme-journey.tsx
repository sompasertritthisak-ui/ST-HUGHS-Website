import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type JourneyStation = { question: string; answer: ReactNode; href: string };

/**
 * The programme journey rail: WHERE ARE YOU NOW? → … → HOW DO I APPLY?
 * Each station answers one question briefly and links to the fuller section.
 */
export function ProgrammeJourney({ stations, className }: { stations: JourneyStation[]; className?: string }) {
  return (
    <nav aria-label="Programme journey" className={className}>
      {/* Phones: a swipeable row of short answers, each jumping to its section (the full grid was ~2 screens). */}
      <ol data-lenis-prevent className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
        {stations.map((s, i) => (
          <li key={s.question} className="w-[72%] shrink-0 snap-start">
            <Link href={s.href} className="flex h-full flex-col rounded-[var(--radius)] border border-line p-4 active:bg-bg-hover">
              <span className="flex items-baseline gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft">
                <span className="tabular text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
                {s.question}
              </span>
              <span className="mt-2 line-clamp-3 text-[0.9375rem] leading-snug text-fg-muted">{s.answer}</span>
            </Link>
          </li>
        ))}
      </ol>
      <ol className="relative grid gap-x-8 gap-y-10 max-sm:hidden sm:grid-cols-2 lg:grid-cols-3">
        {stations.map((s, i) => (
          <Reveal key={s.question} as="li" delay={i * 40} className="relative">
            <Link href={s.href} className="group block border-t border-line pt-5 transition-colors hover:border-route">
              <span aria-hidden className={cn("absolute -top-[3px] left-0 size-[7px] rounded-full", i === 0 ? "bg-route shadow-[0_0_10px_var(--route)]" : "bg-fg-subtle group-hover:bg-route")} />
              <span className="flex items-baseline gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-brand-soft">
                <span className="tabular text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
                {s.question}
              </span>
              <span className="mt-3 block text-[0.9375rem] leading-relaxed text-fg-muted group-hover:text-fg">{s.answer}</span>
            </Link>
          </Reveal>
        ))}
      </ol>
    </nav>
  );
}
