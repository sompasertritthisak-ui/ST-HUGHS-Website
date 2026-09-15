import { Node } from "@/components/ui/node";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  id: string;
  label: string;
  location?: string | null;
  institution?: string | null;
  duration?: string | null;
  description?: string | null;
};

/**
 * The route drawn as a timeline. Vertical by default; `orientation="horizontal"`
 * lays the steps along a single gold line on large screens and falls back to
 * vertical on small screens. The origin node is lit; the rest wait.
 */
export function PathwayTimeline({ steps, orientation = "vertical", className, ariaLabel = "Pathway steps" }: { steps: TimelineStep[]; orientation?: "vertical" | "horizontal"; className?: string; ariaLabel?: string }) {
  if (steps.length === 0) return null;
  const horizontal = orientation === "horizontal";
  return (
    <ol aria-label={ariaLabel} className={cn("relative", horizontal ? "lg:grid lg:grid-flow-col lg:auto-cols-fr lg:gap-6" : "", className)}>
      {/* vertical spine (always on small screens; only for vertical mode on large) */}
      <span aria-hidden className={cn("absolute left-[11px] top-3 bottom-6 w-px bg-route/50", horizontal && "lg:hidden")} />
      {/* horizontal spine */}
      {horizontal ? <span aria-hidden className="absolute left-3 right-3 top-3 hidden h-px bg-route/50 lg:block" /> : null}
      {steps.map((step, i) => (
        <Reveal key={step.id} as="li" delay={i * 40} className={cn("relative pb-10 pl-12 last:pb-0", horizontal && "lg:pb-0 lg:pl-0 lg:pt-10")}>
          <Node active={i === 0} className={cn("absolute left-0 top-0", horizontal && "lg:left-0 lg:top-0")} />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-gold-soft">{step.label}</span>
            {step.duration ? <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">{step.duration}</span> : null}
          </div>
          {step.institution ? <p className="mt-2 text-[1.0625rem] font-medium leading-snug text-fg">{step.institution}</p> : null}
          {step.location ? <p className={cn("text-[0.9375rem] text-fg-muted", !step.institution && "mt-2 font-medium text-fg")}>{step.location}</p> : null}
          {step.description ? <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-fg-muted">{step.description}</p> : null}
        </Reveal>
      ))}
    </ol>
  );
}
