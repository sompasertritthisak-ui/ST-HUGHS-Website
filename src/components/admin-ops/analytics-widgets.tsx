import Link from "next/link";
import type { AnalyticsSummary, RankRow } from "@/lib/admin-ops/analytics";
import { cn } from "@/lib/utils";
import { Panel } from "./panel";
import { EmptyRow, Table, Td, Th, Tr } from "./table";

const fmt = new Intl.NumberFormat("en-GB");

export function KpiTiles({ kpis }: { kpis: AnalyticsSummary["kpis"] }) {
  const tiles: { key: keyof AnalyticsSummary["kpis"]; label: string }[] = [
    { key: "pageViews", label: "Page views" },
    { key: "uniqueSessions", label: "Unique sessions" },
    { key: "programmeViews", label: "Programme views" },
    { key: "pathwayInteractions", label: "Pathway interactions" },
    { key: "destinationClicks", label: "Destination clicks" },
    { key: "universityClicks", label: "University clicks" },
    { key: "enquiries", label: "Enquiries" },
    { key: "consultationRequests", label: "Consultation requests" },
    { key: "applyClicks", label: "Apply clicks" },
    { key: "brochureDownloads", label: "Brochure downloads" },
    { key: "outboundPartnerClicks", label: "Outbound partner clicks" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Key metrics">
      {tiles.map((t) => (
        <li key={t.key} className="rounded-[var(--radius)] border border-line bg-bg-raised px-4 py-3 shadow-sm">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">{t.label}</p>
          <p className="font-display tabular mt-1 text-3xl text-fg">{fmt.format(kpis[t.key])}</p>
        </li>
      ))}
    </ul>
  );
}

/** Horizontal bar chart as inline SVG with a visually-hidden data table. */
export function BarChart({ rows, title, id, valueLabel = "Count" }: { rows: { label: string; count: number }[]; title: string; id: string; valueLabel?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const rowH = 28;
  const labelW = 160;
  const width = 560;
  const barW = width - labelW - 56;
  const height = Math.max(rowH, rows.length * rowH);
  return (
    <figure aria-labelledby={`${id}-title`}>
      <figcaption id={`${id}-title`} className="sr-only">
        {title}
      </figcaption>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-fg-muted">No data in this range.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-describedby={`${id}-table`} aria-label={`${title}: ${rows.map((r) => `${r.label} ${r.count}`).join(", ")}`}>
          {[0.25, 0.5, 0.75, 1].map((t) => (
            <line key={t} x1={labelW + barW * t} x2={labelW + barW * t} y1={0} y2={height} className="stroke-fg-muted/30" strokeWidth={1} strokeDasharray="2 4" />
          ))}
          {rows.map((r, i) => {
            const y = i * rowH;
            const w = Math.max(2, (r.count / max) * barW);
            return (
              <g key={r.label + i}>
                <text x={labelW - 8} y={y + rowH / 2} textAnchor="end" dominantBaseline="middle" className="fill-fg text-[11px]">
                  {r.label.length > 24 ? `${r.label.slice(0, 23)}…` : r.label}
                </text>
                <rect x={labelW} y={y + 7} width={w} height={rowH - 14} className="fill-route" rx={1} />
                <text x={labelW + w + 6} y={y + rowH / 2} dominantBaseline="middle" className="fill-fg-muted text-[11px] tabular">
                  {fmt.format(r.count)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <table id={`${id}-table`} className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.label + i}>
              <td>{r.label}</td>
              <td>{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function Funnel({ stages }: { stages: AnalyticsSummary["funnel"] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <Panel title="Conversion funnel" description="Visitor → programme → pathway → enquiry → consultation → application → enrolment. Later stages are optional until that data exists.">
      <ol className="flex flex-col gap-2" aria-label="Funnel stages">
        {stages.map((s, i) => {
          const prev = i > 0 ? stages[i - 1].count : null;
          const rate = prev && prev > 0 ? Math.round((s.count / prev) * 100) : null;
          const pending = s.optional && s.count === 0;
          return (
            <li key={s.stage} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm">
              <div>
                <p className={cn("font-mono text-[0.6875rem] uppercase tracking-[0.14em]", pending ? "text-fg-subtle" : "text-fg")}>{s.label}</p>
                <p className="text-xs text-fg-subtle">{s.hint}</p>
              </div>
              <div className="h-6 rounded-[var(--radius-sm)] bg-bg-hover" role="presentation">
                <div className={cn("h-full rounded-[var(--radius-sm)]", pending ? "border border-dashed border-line-strong bg-transparent" : "bg-route")} style={{ width: pending ? "100%" : `${Math.max(1.5, (s.count / max) * 100)}%` }} />
              </div>
              <div className="w-28 text-right">
                {pending ? (
                  <span className="text-xs text-fg-subtle">optional / when available</span>
                ) : (
                  <>
                    <span className="tabular font-medium text-fg">{fmt.format(s.count)}</span>
                    {rate !== null ? <span className="ml-2 text-xs text-fg-muted">{rate}%</span> : null}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

export function RankTable({ title, rows, labelHeader, countHeader = "Count", secondaryHeader, emptyText = "No data in this range." }: { title: string; rows: RankRow[]; labelHeader: string; countHeader?: string; secondaryHeader?: string; emptyText?: string }) {
  return (
    <section aria-labelledby={`${title.replace(/\s+/g, "-").toLowerCase()}-h`}>
      <h2 id={`${title.replace(/\s+/g, "-").toLowerCase()}-h`} className="mb-2 text-sm font-semibold text-fg">
        {title}
      </h2>
      <Table>
        <thead>
          <tr>
            <Th>{labelHeader}</Th>
            {secondaryHeader ? <Th className="text-right">{secondaryHeader}</Th> : null}
            <Th className="text-right">{countHeader}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={secondaryHeader ? 3 : 2}>{emptyText}</EmptyRow>
          ) : (
            rows.map((r, i) => (
              <Tr key={r.label + i}>
                <Td className="max-w-80 truncate font-mono text-xs">
                  {r.href ? (
                    <Link href={r.href} className="text-fg underline-offset-2 hover:underline">
                      {r.label}
                    </Link>
                  ) : (
                    r.label
                  )}
                </Td>
                {secondaryHeader ? <Td className="tabular text-right">{fmt.format(r.secondary ?? 0)}</Td> : null}
                <Td className="tabular text-right">{fmt.format(r.count)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </section>
  );
}

export function Sparkline({ points, title }: { points: { day: string; count: number }[]; title: string }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const w = 720;
  const h = 96;
  const gap = 2;
  const bw = Math.max(2, (w - gap * (points.length - 1)) / Math.max(1, points.length));
  const total = points.reduce((a, p) => a + p.count, 0);
  return (
    <figure aria-label={`${title}: ${total} events across ${points.length} days`}>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" role="img" aria-hidden={false} aria-label={`${title}. Daily totals, peak ${max}.`}>
        <line x1={0} x2={w} y1={h - 0.5} y2={h - 0.5} className="stroke-fg-muted/40" strokeWidth={1} />
        {points.map((p, i) => {
          const bh = Math.max(p.count > 0 ? 2 : 0, (p.count / max) * (h - 4));
          return <rect key={p.day} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} className="fill-route" rx={1}>
            <title>{`${p.day}: ${p.count}`}</title>
          </rect>;
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">
        <span>{points[0]?.day}</span>
        <span>{title}</span>
        <span>{points[points.length - 1]?.day}</span>
      </figcaption>
    </figure>
  );
}
