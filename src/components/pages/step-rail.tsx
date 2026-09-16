import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Node } from "@/components/ui/node";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type RailStep = { code?: string; title: string; body: ReactNode; href?: string; linkLabel?: string };

/**
 * Numbered vertical rail on the gold spine. Numbering is used only where the
 * steps form a real sequence (e.g. the admissions journey).
 */
export function StepRail({ steps, numbered = true, className }: { steps: RailStep[]; numbered?: boolean; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      <span aria-hidden className="absolute bottom-6 left-[11px] top-3 w-px bg-route/50" />
      {steps.map((step, i) => (
        <Reveal key={step.title} as="li" delay={i * 40} className="relative grid gap-3 pb-12 pl-12 last:pb-0 md:grid-cols-12 md:gap-8">
          <Node active={i === 0} className="absolute left-0 top-0" />
          <div className="md:col-span-4">
            {numbered ? <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-brand-soft">{step.code ?? String(i + 1).padStart(2, "0")}</span> : null}
            <h3 className="font-display mt-2 text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.05] text-fg">{step.title}</h3>
          </div>
          <div className="md:col-span-8">
            <div className="max-w-[60ch] leading-relaxed text-fg-muted">{step.body}</div>
            {step.href ? (
              <Link href={step.href} className="group mt-4 inline-flex items-center gap-2 text-[0.9375rem] text-brand-soft">
                {step.linkLabel ?? "Continue"}
                <ArrowRight aria-hidden className="size-4 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-1" strokeWidth={1.5} />
              </Link>
            ) : null}
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
