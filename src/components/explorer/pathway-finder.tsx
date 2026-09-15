"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import type { Programme } from "@prisma/client";
import type { PathwayWithRelations } from "@/lib/content";
import { cn, toSlug } from "@/lib/utils";
import { track } from "@/lib/analytics-client";
import { Button } from "@/components/ui/button";
import { PathwayCard } from "@/components/cards/pathway-card";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ExplorerDestination } from "./data";
import {
  DEGREE_OPTIONS,
  ENGLISH_OPTIONS,
  QUALIFICATION_OPTIONS,
  START_OPTIONS,
  TIMELINE_OPTIONS,
  recommend,
  type FinderAnswers,
  type FinderKey,
  type FinderOption,
} from "./finder-rules";

type Question = { key: FinderKey; legend: string; hint?: string; options: FinderOption[] };

export function PathwayFinder({
  pathways,
  programmes,
  destinations,
  disclaimer,
}: {
  pathways: PathwayWithRelations[];
  programmes: Programme[];
  destinations: ExplorerDestination[];
  disclaimer: string;
}) {
  const reduced = useReducedMotion();
  const [answers, setAnswers] = useState<FinderAnswers>({});
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const legendRef = useRef<HTMLLegendElement | null>(null);
  const resultsRef = useRef<HTMLHeadingElement | null>(null);
  const trackedFor = useRef<string | null>(null);

  const questions = useMemo<Question[]>(() => {
    const subjects = [...new Set(pathways.map((p) => p.subjectArea).filter((s): s is string => Boolean(s)))];
    const reachable = destinations.filter((d) => pathways.some((p) => p.destination?.slug === d.slug));
    return [
      { key: "qualification", legend: "What is your current qualification?", hint: "Choose the closest match — the advisor confirms equivalencies.", options: QUALIFICATION_OPTIONS },
      { key: "subject", legend: "Which subject area interests you?", options: [...subjects.map((s) => ({ value: toSlug(s), label: s })), { value: "not-sure", label: "Not sure yet" }] },
      { key: "degree", legend: "Which degree level are you aiming for?", options: DEGREE_OPTIONS },
      { key: "country", legend: "Do you have a preferred country?", hint: "Only countries with a published route are listed.", options: [...reachable.map((d) => ({ value: d.slug, label: d.country })), { value: "any", label: "Open to any country" }] },
      { key: "start", legend: "Where would you like to start?", options: START_OPTIONS },
      { key: "english", legend: "What is your English level?", hint: "An estimate is fine.", options: ENGLISH_OPTIONS },
      { key: "timeline", legend: "When do you want to start?", options: TIMELINE_OPTIONS },
    ];
  }, [pathways, destinations]);

  const current = questions[index];
  const answered = Boolean(answers[current?.key]);
  const total = questions.length;

  const result = useMemo(() => (done ? recommend(answers, pathways, programmes) : null), [done, answers, pathways, programmes]);

  useEffect(() => {
    if (!done) legendRef.current?.focus();
  }, [index, done]);

  useEffect(() => {
    if (!result) return;
    resultsRef.current?.focus();
    const key = `${result.programme?.slug ?? "none"}|${result.destinationSlug ?? "any"}`;
    if (trackedFor.current === key) return;
    trackedFor.current = key;
    track("finder_completed", { programme: result.programme?.slug ?? "none", destination: result.destinationSlug ?? "any" });
  }, [result]);

  const next = () => {
    if (!answered) return;
    if (index < total - 1) setIndex(index + 1);
    else setDone(true);
  };
  const back = () => {
    if (done) setDone(false);
    else if (index > 0) setIndex(index - 1);
  };
  const restart = () => {
    setAnswers({});
    setIndex(0);
    setDone(false);
  };

  if (pathways.length === 0) {
    return (
      <section className="container-x pb-20">
        <EmptyState title="Routes are being confirmed" body="The finder needs at least one published route. Please talk to an advisor in the meantime." action={<Button href="/consultation">Book a consultation</Button>} />
      </section>
    );
  }

  const consultationHref = result
    ? `/consultation?${new URLSearchParams({
        ...(result.programme ? { programme: result.programme.slug } : {}),
        ...(result.destinationSlug ? { destination: result.destinationSlug } : {}),
      }).toString()}`
    : "/consultation";

  return (
    <section className="container-x pb-20" aria-labelledby="finder-heading">
      <h2 id="finder-heading" className="sr-only">
        Pathway Finder questions
      </h2>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* ── Progress rail ── */}
        <aside className="lg:col-span-4" aria-label="Progress">
          <p className="eyebrow eyebrow-rule">
            {done ? "Your routes" : `Question ${index + 1} of ${total}`}
          </p>
          <ol className="mt-6 hidden flex-col gap-0 lg:flex">
            {questions.map((q, i) => {
              const value = answers[q.key];
              const label = q.options.find((o) => o.value === value)?.label;
              const state = done || i < index ? "done" : i === index ? "current" : "pending";
              return (
                <li key={q.key} className="relative flex gap-4 pb-5 pl-6">
                  <span aria-hidden className={cn("absolute left-[3px] top-[7px] size-[7px] rounded-full", state === "pending" ? "border border-line-strong" : "bg-route", state === "current" && "shadow-[0_0_10px_var(--route)]")} />
                  {i < total - 1 ? <span aria-hidden className={cn("absolute left-[6px] top-[16px] h-[calc(100%-12px)] w-px", state === "done" ? "bg-route/60" : "bg-line")} /> : null}
                  <div className="min-w-0">
                    <p className={cn("font-mono text-[0.625rem] uppercase tracking-[0.14em]", state === "pending" ? "text-fg-subtle" : "text-gold-soft")}>{q.key.replace("-", " ")}</p>
                    <p className={cn("truncate text-sm", label ? "text-fg" : "text-fg-subtle")}>{label ?? (state === "current" ? "Choosing…" : "—")}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          {/* Mobile segmented progress */}
          <div className="mt-4 flex gap-1 lg:hidden" aria-hidden>
            {questions.map((q, i) => (
              <span key={q.key} className={cn("h-px flex-1", done || i <= index ? "bg-route" : "bg-line")} />
            ))}
          </div>
        </aside>

        {/* ── Question / result ── */}
        <div className="lg:col-span-8">
          {!done && current ? (
            <form
              key={current.key}
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <fieldset className="min-w-0 border-0 p-0">
                <legend ref={legendRef} tabIndex={-1} className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.05] text-fg outline-none text-balance">
                  {current.legend}
                </legend>
                {current.hint ? <p className="mt-3 text-fg-muted">{current.hint}</p> : null}
                <div className="mt-8 grid gap-2 sm:grid-cols-2">
                  {current.options.map((opt, j) => {
                    const id = `${current.key}-${opt.value}`;
                    const checked = answers[current.key] === opt.value;
                    return (
                      <motion.div
                        key={opt.value}
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : j * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <input
                          type="radio"
                          id={id}
                          name={current.key}
                          value={opt.value}
                          checked={checked}
                          onChange={() => setAnswers((a) => ({ ...a, [current.key]: opt.value }))}
                          className="peer sr-only"
                        />
                        <label
                          htmlFor={id}
                          className={cn(
                            "flex min-h-[64px] cursor-pointer flex-col justify-center gap-1 rounded-[var(--radius)] border px-4 py-3 transition-colors duration-[var(--dur-fast)]",
                            "border-line bg-bg-raised hover:border-route/70 peer-checked:border-route peer-checked:bg-bg-hover/60 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span aria-hidden className={cn("size-3 shrink-0 rounded-full border", checked ? "border-route bg-route shadow-[0_0_8px_var(--route)]" : "border-line-strong")} />
                            <span className="text-[1rem] font-medium leading-snug text-fg">{opt.label}</span>
                          </span>
                          {opt.hint ? <span className="pl-6 text-sm text-fg-muted">{opt.hint}</span> : null}
                        </label>
                      </motion.div>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" onClick={back} disabled={index === 0}>
                  <ArrowLeft aria-hidden className="size-4" strokeWidth={1.5} />
                  Back
                </Button>
                <Button type="submit" arrow="right" disabled={!answered}>
                  {index === total - 1 ? "See my routes" : "Continue"}
                </Button>
              </div>
            </form>
          ) : null}

          <div aria-live="polite" aria-atomic="false">
            {result ? (
              <motion.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}>
                <h3 ref={resultsRef} tabIndex={-1} className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.05] text-fg outline-none text-balance">
                  {result.pathways.length === 1 ? "One route to consider." : `${result.pathways.length} routes to consider.`}
                </h3>

                <p className="mt-6 flex gap-4 border-l-2 border-route bg-bg-raised py-4 pl-5 pr-4 text-[1.0625rem] leading-relaxed text-fg" role="note">
                  {disclaimer}
                </p>

                {result.notes.length ? (
                  <ul className="mt-6 flex flex-col gap-2 text-[0.9375rem] leading-relaxed text-fg-muted">
                    {result.notes.map((n) => (
                      <li key={n} className="relative pl-5 before:absolute before:left-0 before:top-[0.8em] before:h-px before:w-3 before:bg-route">
                        {n}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  {result.pathways.map((p) => (
                    <PathwayCard key={p.slug} pathway={p} />
                  ))}
                  {result.programme ? <ProgrammeCard programme={result.programme} className="md:col-span-2" /> : null}
                </div>

                <div className="mt-12">
                  <p className="eyebrow eyebrow-rule">Questions to ask your advisor</p>
                  <ol className="mt-5 grid gap-3 md:grid-cols-2">
                    {result.questions.map((qn, i) => (
                      <li key={qn} className="flex gap-4 border-t border-line pt-3 text-[0.9375rem] leading-relaxed text-fg">
                        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-gold-soft tabular">{String(i + 1).padStart(2, "0")}</span>
                        <span>{qn}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-8">
                  <Button href={consultationHref} arrow="right">
                    Book a consultation
                  </Button>
                  <Button type="button" variant="secondary" onClick={back}>
                    Change my answers
                  </Button>
                  <button type="button" onClick={restart} className="min-h-11 px-2 text-sm text-fg-muted underline decoration-route/60 underline-offset-4 hover:text-fg">
                    Start again
                  </button>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
