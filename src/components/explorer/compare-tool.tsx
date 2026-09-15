"use client";

import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Programme } from "@prisma/client";
import type { PathwayWithRelations } from "@/lib/content";
import { PROGRAMME_TYPE_LABELS, type ProgrammeType } from "@/lib/enums";
import { cn, parseStringArray } from "@/lib/utils";
import { track } from "@/lib/analytics-client";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const COMPARE_MAX = 3;
const EMPTY = "Confirmed by the admissions team";

type Item =
  | { kind: "programme"; slug: string; label: string; href: string; programme: Programme }
  | { kind: "pathway"; slug: string; label: string; href: string; pathway: PathwayWithRelations };

type Ctx = { pathways: PathwayWithRelations[]; programmes: Programme[] };

function distinct(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

function joinOrNull(values: string[]) {
  return values.length ? values.join(" · ") : null;
}

const programmeOf = (pw: PathwayWithRelations, ctx: Ctx) => (pw.programme ? ctx.programmes.find((p) => p.slug === pw.programme!.slug) : undefined);
const pathwaysOf = (p: Programme, ctx: Ctx) => ctx.pathways.filter((pw) => pw.programme?.slug === p.slug);

const ROWS: { key: string; label: string; cell: (item: Item, ctx: Ctx) => ReactNode }[] = [
  { key: "programme", label: "Programme", cell: (i) => (i.kind === "programme" ? i.programme.title : i.pathway.programme?.title ?? null) },
  { key: "duration", label: "Duration", cell: (i) => (i.kind === "programme" ? i.programme.durationLabel : i.pathway.totalDurationLabel) },
  { key: "location", label: "Location", cell: (i) => (i.kind === "programme" ? i.programme.studyLocation : i.pathway.startLocation) },
  {
    key: "structure",
    label: "Pathway structure",
    cell: (i, ctx) => (i.kind === "programme" ? joinOrNull(distinct(pathwaysOf(i.programme, ctx).map((pw) => pw.structureLabel))) : i.pathway.structureLabel),
  },
  {
    key: "destination",
    label: "Destination",
    cell: (i, ctx) => (i.kind === "programme" ? joinOrNull(distinct(pathwaysOf(i.programme, ctx).map((pw) => pw.destination?.country))) : i.pathway.destination?.country ?? null),
  },
  { key: "qualification", label: "Qualification", cell: (i) => (i.kind === "programme" ? i.programme.qualification : i.pathway.qualification) },
  { key: "subject", label: "Subject", cell: (i) => (i.kind === "programme" ? joinOrNull(parseStringArray(i.programme.subjectRoutesJson)) : i.pathway.subjectArea) },
  { key: "entry", label: "Entry requirements", cell: (i, ctx) => (i.kind === "programme" ? i.programme.entryRequirements : programmeOf(i.pathway, ctx)?.entryRequirements ?? null) },
  { key: "english", label: "English requirement", cell: (i, ctx) => (i.kind === "programme" ? i.programme.englishRequirement : programmeOf(i.pathway, ctx)?.englishRequirement ?? null) },
  { key: "progression", label: "Progression", cell: (i) => (i.kind === "programme" ? i.programme.progression : i.pathway.progressionRequirements) },
  {
    key: "transfer",
    label: "Transfer point",
    cell: (i, ctx) => (i.kind === "programme" ? joinOrNull(distinct(pathwaysOf(i.programme, ctx).map((pw) => pw.transferPoint))) : i.pathway.transferPoint),
  },
  {
    key: "verification",
    label: "Verification",
    cell: (i) => <VerificationBadge status={i.kind === "programme" ? i.programme.verificationStatus : i.pathway.verificationStatus} />,
  },
];

function Cell({ value }: { value: ReactNode }) {
  if (value === null || value === undefined || value === "") return <span className="text-fg-subtle">{EMPTY}</span>;
  return <>{value}</>;
}

export function CompareTool({ programmes, pathways, disclaimer }: { programmes: Programme[]; pathways: PathwayWithRelations[]; disclaimer: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const ctx = useMemo<Ctx>(() => ({ pathways, programmes }), [pathways, programmes]);

  const catalogue = useMemo<Item[]>(
    () => [
      ...programmes.map<Item>((p) => ({ kind: "programme", slug: p.slug, label: p.shortTitle ?? p.title, href: `/programmes/${p.slug}`, programme: p })),
      ...pathways.map<Item>((pw) => ({ kind: "pathway", slug: pw.slug, label: pw.title, href: `/pathways/${pw.slug}`, pathway: pw })),
    ],
    [programmes, pathways],
  );

  const selectedSlugs = useMemo(() => {
    const raw = searchParams.get("items") ?? "";
    const wanted = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const valid = wanted.filter((s) => catalogue.some((c) => c.slug === s));
    return [...new Set(valid)].slice(0, COMPARE_MAX);
  }, [searchParams, catalogue]);

  const selected = selectedSlugs.map((s) => catalogue.find((c) => c.slug === s)!).filter(Boolean);
  const full = selected.length >= COMPARE_MAX;

  const commit = useCallback(
    (slugs: string[]) => {
      const qs = slugs.length ? `?items=${encodeURIComponent(slugs.join(","))}` : "";
      window.history.replaceState(null, "", `${pathname}${qs}`);
    },
    [pathname],
  );

  const toggle = (slug: string) => {
    if (selectedSlugs.includes(slug)) commit(selectedSlugs.filter((s) => s !== slug));
    else if (!full) commit([...selectedSlugs, slug]);
  };

  const itemsKey = selectedSlugs.join(",");
  useEffect(() => {
    if (selectedSlugs.length >= 2) track("comparison_used", { items: itemsKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const groups: { title: string; items: Item[] }[] = [
    { title: "Programmes", items: catalogue.filter((c) => c.kind === "programme") },
    { title: "Pathways", items: catalogue.filter((c) => c.kind === "pathway") },
  ];

  return (
    <section className="container-x pb-20" aria-labelledby="compare-heading">
      <h2 id="compare-heading" className="sr-only">
        Choose what to compare
      </h2>

      {/* ── Picker ── */}
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow eyebrow-rule">Pick up to three</p>
          <p className="mt-4 text-fg-muted">Choose programmes, pathways, or a mix. Your selection is saved in the link so you can share it.</p>
          <p className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle" aria-live="polite">
            <span className="text-gold-soft tabular">{selected.length}</span> of {COMPARE_MAX} selected
          </p>
          {selected.length > 0 ? (
            <button type="button" onClick={() => commit([])} className="mt-3 min-h-11 text-sm text-fg-muted underline decoration-route/60 underline-offset-4 hover:text-fg">
              Clear selection
            </button>
          ) : null}
        </div>
        <div className="grid gap-8 lg:col-span-8 md:grid-cols-2">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{g.title}</p>
              <ul className="flex flex-col gap-2">
                {g.items.map((item) => {
                  const pressed = selectedSlugs.includes(item.slug);
                  const blocked = full && !pressed;
                  return (
                    <li key={item.slug}>
                      <button
                        type="button"
                        aria-pressed={pressed}
                        aria-disabled={blocked || undefined}
                        onClick={() => toggle(item.slug)}
                        className={cn(
                          "flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[var(--radius)] border px-4 py-2.5 text-left text-[0.9375rem] transition-colors duration-[var(--dur-fast)]",
                          pressed ? "border-route bg-bg-raised text-fg" : "border-line bg-transparent text-fg-muted hover:border-line-strong hover:text-fg",
                          blocked && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          {item.kind === "pathway" && item.pathway.structureLabel ? (
                            <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-fg-subtle">{item.pathway.structureLabel}</span>
                          ) : item.kind === "programme" ? (
                            <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-fg-subtle">{PROGRAMME_TYPE_LABELS[item.programme.type as ProgrammeType] ?? item.programme.type}</span>
                          ) : null}
                          <span aria-hidden className={cn("size-2 rounded-full", pressed ? "bg-route shadow-[0_0_8px_var(--route)]" : "border border-line-strong")} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison ── */}
      <div className="mt-14">
        {selected.length === 0 ? (
          <EmptyState title="Nothing to compare yet" body="Choose one to three programmes or pathways above to see them side by side." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full table-fixed border-collapse text-[0.9375rem]">
                <caption className="sr-only">Side-by-side comparison of the selected programmes and pathways</caption>
                <thead className="sticky top-[72px] z-10 bg-bg">
                  <tr>
                    <th scope="col" className="w-[200px] border-b border-line-strong py-4 pr-4 text-left align-bottom font-mono text-[0.6875rem] font-normal uppercase tracking-[0.14em] text-fg-subtle">
                      Compare
                    </th>
                    {selected.map((item) => (
                      <th key={item.slug} scope="col" className="border-b border-line-strong px-4 py-4 text-left align-bottom">
                        <span className="block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-gold-soft">{item.kind}</span>
                        <Link href={item.href} className="mt-1 block font-display text-[1.5rem] leading-tight text-fg hover:text-gold-soft">
                          {item.label}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.key} className="border-b border-line align-top">
                      <th scope="row" className="py-4 pr-4 text-left font-mono text-[0.6875rem] font-normal uppercase tracking-[0.14em] text-fg-muted">
                        {row.label}
                      </th>
                      {selected.map((item) => (
                        <td key={item.slug} className="px-4 py-4 leading-relaxed text-fg">
                          <Cell value={row.cell(item, ctx)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="grid gap-6 md:hidden">
              {selected.map((item) => (
                <article key={item.slug} className="surface-raised rounded-[var(--radius)] p-5">
                  <span className="block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-gold-soft">{item.kind}</span>
                  <h3 className="mt-1 font-display text-[1.75rem] leading-tight text-fg">
                    <Link href={item.href} className="hover:text-gold-soft">
                      {item.label}
                    </Link>
                  </h3>
                  <dl className="mt-5 divide-y divide-line">
                    {ROWS.map((row) => (
                      <div key={row.key} className="py-3">
                        <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted">{row.label}</dt>
                        <dd className="mt-1 text-[1rem] leading-relaxed text-fg">
                          <Cell value={row.cell(item, ctx)} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-6 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
              <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">
                <span className="text-fg">{disclaimer}</span> Entry requirements, English levels and partner arrangements are confirmed in writing by the admissions team.
              </p>
              <Button href={`/consultation${selected[0] ? `?${selected[0].kind}=${encodeURIComponent(selected[0].slug)}` : ""}`} arrow="right" className="shrink-0">
                Book a consultation
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
