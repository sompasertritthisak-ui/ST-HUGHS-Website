"use client";

import { motion, useReducedMotion } from "motion/react";
import type { PathwayWithRelations } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Horizontal progression timeline for a single route: Foundation → Year 1 →
 * … → Career, with durations. Nodes light in sequence along the gold line.
 */
export function ProgressionTimeline({ pathway, className }: { pathway: PathwayWithRelations; className?: string }) {
  const reduced = useReducedMotion();
  const steps = pathway.steps;
  if (steps.length === 0) return null;
  return (
    <div className={cn("overflow-x-auto", className)}>
      <ol className="relative flex min-w-[560px] items-start gap-3" aria-label={`Progression for ${pathway.title}`}>
        <motion.span
          aria-hidden
          className="absolute left-3 right-3 top-[5px] h-px origin-left bg-route/60"
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        {steps.map((s, i) => {
          const isCareer = s.label.toLowerCase() === "career";
          return (
            <motion.li
              key={s.id}
              className="relative flex min-w-0 flex-1 flex-col pl-3"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                aria-hidden
                className={cn("absolute left-3 top-0 z-10 size-[11px] -translate-x-1/2 rounded-full border border-route", i === 0 ? "bg-route shadow-[0_0_10px_var(--route)]" : isCareer ? "bg-transparent" : "bg-bg")}
              />
              <span className="mt-5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-gold-soft">{s.label}</span>
              <span className="mt-1 text-sm font-medium text-fg">{s.institution ?? s.location ?? ""}</span>
              {s.institution && s.location ? <span className="text-xs text-fg-muted">{s.location}</span> : null}
              {s.duration ? <span className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle tabular">{s.duration}</span> : null}
            </motion.li>
          );
        })}
      </ol>
      {pathway.totalDurationLabel ? (
        <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted">
          Total <span className="text-fg">{pathway.totalDurationLabel}</span>
          {pathway.structureLabel ? (
            <>
              {" · "}Structure <span className="text-fg">{pathway.structureLabel}</span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
