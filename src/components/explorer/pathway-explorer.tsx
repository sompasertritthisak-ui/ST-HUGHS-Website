"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
import { track } from "@/lib/analytics-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PathwayCard } from "@/components/cards/pathway-card";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { UniversityCard } from "@/components/cards/university-card";
import type { ExplorerData } from "./data";
import { RouteMap, type MapRoute } from "./route-map";
import { ProgressionTimeline } from "./progression-timeline";
import {
  describeSelection,
  findOrigin,
  paramsToSelection,
  pathwayGeo,
  resolve,
  selectionToParams,
  truncateSelection,
  type Selection,
  type StepKey,
} from "./model";

const STORAGE_KEY = "shv.explorer.selection";

function readStored(): Selection | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Selection) : null;
  } catch {
    return null;
  }
}

export function PathwayExplorer({ data }: { data: Omit<ExplorerData, "messaging"> }) {
  const { pathways, programmes, universities, destinations } = data;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const selection = useMemo(() => paramsToSelection(searchParams), [searchParams]);
  const resolution = useMemo(() => resolve(pathways, selection), [pathways, selection]);
  const origin = useMemo(() => findOrigin(pathways), [pathways]);
  const hasSelection = Object.keys(selection).length > 0;

  const interacted = useRef(false);
  const completedFor = useRef<Set<string>>(new Set());
  const currentHeading = useRef<HTMLHeadingElement | null>(null);

  const commit = useCallback(
    (next: Selection) => {
      const params = selectionToParams(next);
      const qs = params.toString();
      // Native history integrates with the App Router, so useSearchParams
      // updates without a server round-trip.
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage is a convenience only */
      }
    },
    [pathname],
  );

  // Restore the last route when arriving without a deep link.
  useEffect(() => {
    if (hasSelection) return;
    const stored = readStored();
    if (stored && Object.keys(stored).length > 0) commit(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move focus to the next question after a choice (keyboard / screen reader flow).
  useEffect(() => {
    if (interacted.current && currentHeading.current) currentHeading.current.focus({ preventScroll: false });
  }, [resolution.current?.key, resolution.complete]);

  // Completion analytics, once per matched route.
  useEffect(() => {
    if (!resolution.complete || resolution.matched.length !== 1) return;
    const slug = resolution.matched[0].slug;
    if (completedFor.current.has(slug)) return;
    completedFor.current.add(slug);
    track("explorer_completed", { pathway: slug });
  }, [resolution]);

  const choose = (key: StepKey, value: string) => {
    interacted.current = true;
    const next = truncateSelection(selection, key);
    next[key] = value;
    commit(next);
    track("pathway_interaction", { step: key, value });
  };

  const change = (key: StepKey) => {
    interacted.current = true;
    commit(truncateSelection(selection, key));
  };

  const reset = () => {
    interacted.current = true;
    commit({});
  };

  // Map derivations.
  const emphasise = resolution.complete || resolution.matched.length === 1;
  const routes: MapRoute[] = useMemo(
    () =>
      resolution.matched
        .map((p) => ({ id: p.slug, points: pathwayGeo(p, origin), active: emphasise }))
        .filter((r) => r.points.length >= 2),
    [resolution.matched, origin, emphasise],
  );
  const reachable = useMemo(() => new Set(resolution.matched.map((p) => p.destination?.slug).filter((s): s is string => Boolean(s))), [resolution.matched]);
  const chosenDestination = resolution.steps.find((s) => s.key === "destination")?.chosen?.value;
  const summary = describeSelection(resolution);

  const matchedOne = resolution.complete && resolution.matched.length >= 1 ? resolution.matched[0] : null;
  const programme = matchedOne?.programme ? programmes.find((p) => p.slug === matchedOne.programme!.slug) : undefined;
  const university = matchedOne?.university ? universities.find((u) => u.slug === matchedOne.university!.slug) : undefined;
  const matchedSlugs = resolution.matched.map((p) => p.slug);

  if (pathways.length === 0) {
    return (
      <section className="container-x pb-20">
        <EmptyState title="Routes are being confirmed" body="Published pathways will appear here as soon as the admissions team confirms them." action={<Button href="/consultation">Talk to an advisor</Button>} />
      </section>
    );
  }

  return (
    <section className="container-x pb-20" aria-labelledby="explorer-heading">
      <h2 id="explorer-heading" className="sr-only">
        Choose your route
      </h2>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* ── Map (sticky on desktop, compact on mobile) ── */}
        <div className="order-first lg:order-2 lg:col-span-7">
          <div className="lg:sticky lg:top-[96px]">
            <div className="surface-raised relative overflow-hidden rounded-[var(--radius-lg)]">
              <div className="relative aspect-[16/9] w-full lg:aspect-[1000/380]">
                <div className="absolute inset-0 p-3 sm:p-5">
                  <RouteMap origin={origin} destinations={destinations} routes={routes} reachable={reachable} selected={chosenDestination} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line px-4 py-3 sm:px-5">
                <p className="min-w-0 break-words font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted" aria-hidden>
                  {resolution.matched.length === 1 ? (
                    <span className="text-gold-soft">{resolution.matched[0].code ?? resolution.matched[0].title}</span>
                  ) : (
                    <>
                      <span className="text-gold-soft tabular">{resolution.matched.length}</span> routes from {origin?.label ?? "the origin"}
                    </>
                  )}
                </p>
                <p className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle" aria-hidden>
                  {reachable.size} {reachable.size === 1 ? "destination" : "destinations"}
                </p>
              </div>
              <p className="sr-only" aria-live="polite">
                {summary}
              </p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {resolution.matched.length === 1 ? (
                <motion.div
                  key={resolution.matched[0].slug}
                  className="mt-6 hidden lg:block"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.3 }}
                >
                  <p className="eyebrow eyebrow-rule mb-5">Progression</p>
                  <ProgressionTimeline pathway={resolution.matched[0]} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Chooser ── */}
        <div className="lg:order-1 lg:col-span-5">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="eyebrow eyebrow-rule">Your route</p>
            {hasSelection ? (
              <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 text-sm text-fg-muted hover:text-fg">
                <RotateCcw aria-hidden className="size-3.5" strokeWidth={1.5} />
                Start again
              </button>
            ) : null}
          </div>

          <ol className="divide-y divide-line border-y border-line">
            {resolution.steps.map((step, i) => {
              const index = String(i + 1).padStart(2, "0");
              if (step.status === "skipped") return null;
              if (step.status === "pending") {
                return (
                  <li key={step.key} className="flex items-center gap-4 py-4 opacity-50">
                    <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-fg-subtle tabular">{index}</span>
                    <span className="text-sm text-fg-muted">{step.label}</span>
                  </li>
                );
              }
              if (step.status === "done" || step.status === "auto") {
                const changeable = step.options.length > 1;
                return (
                  <li key={step.key} className="flex items-center gap-4 py-4">
                    <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-gold-soft tabular">{index}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">{step.label}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] font-medium text-fg">
                        <Check aria-hidden className="size-3.5 text-gold-soft" strokeWidth={2} />
                        <span>{step.chosen!.label}</span>
                        {step.chosen!.verification !== "VERIFIED" ? <VerificationBadge status={step.chosen!.verification} /> : null}
                        {!changeable ? <span className="text-xs font-normal text-fg-subtle">Only option on this route</span> : null}
                      </p>
                    </div>
                    {changeable ? (
                      <button type="button" onClick={() => change(step.key)} className="min-h-11 shrink-0 px-2 text-sm text-fg-muted underline decoration-route/60 underline-offset-4 hover:text-fg">
                        Change
                      </button>
                    ) : null}
                  </li>
                );
              }
              // current
              return (
                <li key={step.key} className="py-6">
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-gold-soft tabular">{index}</span>
                    <div>
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">{step.label}</p>
                      <h3 ref={currentHeading} tabIndex={-1} className="font-display mt-1 text-[clamp(1.5rem,2.4vw,2rem)] text-fg outline-none">
                        {step.prompt}
                      </h3>
                    </div>
                  </div>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2" aria-label={`${step.label} options`}>
                    {step.options.map((opt, j) => (
                      <motion.li
                        key={opt.value}
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : j * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <button
                          type="button"
                          aria-pressed={false}
                          onClick={() => choose(step.key, opt.value)}
                          className={cn(
                            "group flex min-h-[64px] w-full flex-col items-start justify-between gap-2 rounded-[var(--radius)] border border-line bg-bg-raised px-4 py-3 text-left transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                            "hover:border-route/70 hover:bg-bg-hover/60 focus-visible:border-route",
                          )}
                        >
                          <span className="text-[0.9375rem] font-medium leading-snug text-fg">{opt.label}</span>
                          <span className="flex w-full flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-fg-subtle">
                              {opt.meta ? <>{opt.meta} · </> : null}
                              {opt.count} {opt.count === 1 ? "route" : "routes"}
                            </span>
                            {opt.verification !== "VERIFIED" ? <VerificationBadge status={opt.verification} /> : null}
                          </span>
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>

          {resolution.matched.length === 1 ? (
            <div className="mt-8 lg:hidden">
              <p className="eyebrow eyebrow-rule mb-5">Progression</p>
              <ProgressionTimeline pathway={resolution.matched[0]} />
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Final state ── */}
      <AnimatePresence initial={false}>
        {matchedOne ? (
          <motion.div
            key={matchedSlugs.join(",")}
            className="mt-16 border-t border-line pt-12"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-live="polite"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow eyebrow-rule">Your route</p>
                <h3 className="font-display mt-4 text-[clamp(2rem,4vw,3.25rem)] text-fg text-balance">{matchedOne.title}</h3>
                {matchedOne.summary ? <p className="mt-4 text-lg leading-relaxed text-fg-muted text-pretty">{matchedOne.summary}</p> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href={`/consultation?pathway=${encodeURIComponent(matchedOne.slug)}`} arrow="right">
                  Book a consultation about this route
                </Button>
                <Button href={`/compare?items=${encodeURIComponent(matchedSlugs.join(","))}`} variant="secondary">
                  Compare
                </Button>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {resolution.matched.map((p) => (
                <PathwayCard key={p.slug} pathway={p} />
              ))}
              {programme ? <ProgrammeCard programme={programme} className="border-t-0 pt-0 md:border-t md:pt-6" /> : null}
              {university ? <UniversityCard university={university} /> : null}
            </div>

            {matchedOne.verificationStatus !== "VERIFIED" ? (
              <p className="mt-8 flex flex-wrap items-center gap-3 text-sm text-fg-muted">
                <VerificationBadge status={matchedOne.verificationStatus} />
                Details of this route are being confirmed with the partner. An advisor can tell you what is confirmed today.
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
