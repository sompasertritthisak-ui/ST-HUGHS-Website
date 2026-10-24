export type CostRow = { period: string; where: string; tuition: string; living: string; total: string };

/** One CMS line = one row: "Year | Where | Tuition | Living | Total". Lines that do not split into five cells are skipped. */
export function parseCostRows(raw: string[]): CostRow[] {
  return raw
    .map((line) => line.split("|").map((c) => c.trim()))
    .filter((c) => c.length >= 5 && c[0])
    .map(([period, where, tuition, living, total]) => ({ period, where, tuition, living, total }));
}

const notIncluded = (v: string) => /^(not included|—|-|n\/a)$/i.test(v);

/** Year-by-year cost estimate (management feedback: "price at a glance"). A table on wide screens, cards on phones. */
export function CostAtAGlance({ rows, note, disclaimer }: { rows: CostRow[]; note?: string | null; disclaimer: string }) {
  if (!rows.length) return null;
  const kind = (r: CostRow) => (notIncluded(r.living) ? "Tuition only" : notIncluded(r.tuition) ? "Living only" : "Tuition + living");
  return (
    <div>
      <table className="w-full border-collapse text-left max-sm:hidden">
        <thead>
          <tr className="border-b-2 border-fg/80 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">
            <th scope="col" className="py-3 pr-4 font-semibold">Study year</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Tuition</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Living estimate</th>
            <th scope="col" className="py-3 font-semibold">Annual subtotal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.period + r.where} className="border-b border-line align-top">
              <th scope="row" className="py-4 pr-4 font-normal">
                <span className="block font-semibold text-fg">{r.period}</span>
                <span className="text-[0.8125rem] text-fg-muted">{r.where}</span>
              </th>
              <td className="py-4 pr-4 text-fg">{r.tuition}</td>
              <td className="py-4 pr-4 text-fg">{r.living}</td>
              <td className="py-4">
                <span className="block font-semibold text-fg">{r.total}</span>
                <span className="text-[0.8125rem] text-fg-muted">{kind(r)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="grid gap-3 sm:hidden">
        {rows.map((r) => (
          <li key={r.period + r.where} className="rounded-[var(--radius)] border border-line p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-fg">{r.period}</span>
              <span className="text-[1.125rem] font-semibold text-fg">{r.total}</span>
            </div>
            <p className="text-[0.8125rem] text-fg-muted">{r.where}</p>
            <p className="mt-2 text-[0.875rem] text-fg-muted">
              Tuition <span className="font-medium text-fg">{r.tuition}</span> · Living <span className="font-medium text-fg">{r.living}</span>
            </p>
          </li>
        ))}
      </ul>
      {note ? <p className="mt-5 text-[0.9375rem] leading-relaxed text-fg">{note}</p> : null}
      <p className="mt-2 text-[0.8125rem] text-fg-muted">{disclaimer} Final fees are confirmed by the admissions team for your intake.</p>
    </div>
  );
}
