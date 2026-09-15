import { cn } from "@/lib/utils";

const SKIP = new Set(["id", "createdAt", "updatedAt"]);

function show(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v;
  return JSON.stringify(v, null, 1);
}

/** Changed-keys view between a snapshot (then) and the current record (now). */
export function RevisionDiff({ then, now }: { then: Record<string, unknown>; now: Record<string, unknown> }) {
  const keys = [...new Set([...Object.keys(then), ...Object.keys(now)])].filter((k) => !SKIP.has(k) && (typeof now[k] !== "object" || now[k] === null || now[k] instanceof Date)).sort();
  const rows = keys.map((k) => {
    const a = then[k] instanceof Date ? (then[k] as Date).toISOString() : then[k];
    const b = now[k] instanceof Date ? (now[k] as Date).toISOString() : now[k];
    return { key: k, then: a, now: b, changed: JSON.stringify(a ?? null) !== JSON.stringify(b ?? null) };
  });
  const changed = rows.filter((r) => r.changed);
  if (changed.length === 0) return <p className="text-sm text-fg-muted">This version is identical to the current record.</p>;
  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-line">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="bg-bg-hover">
          <tr className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">
            <th scope="col" className="w-40 px-3 py-2 text-left font-normal">Field</th>
            <th scope="col" className="px-3 py-2 text-left font-normal">This version</th>
            <th scope="col" className="px-3 py-2 text-left font-normal">Current</th>
          </tr>
        </thead>
        <tbody>
          {changed.map((r) => (
            <tr key={r.key} className="border-t border-line align-top">
              <th scope="row" className="px-3 py-2 text-left font-mono text-xs font-normal text-fg-muted">{r.key}</th>
              <td className={cn("whitespace-pre-wrap break-words px-3 py-2", "text-fg")}>{show(r.then)}</td>
              <td className="whitespace-pre-wrap break-words px-3 py-2 text-fg-muted">{show(r.now)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-3 py-2 text-xs text-fg-subtle">{changed.length} changed field{changed.length === 1 ? "" : "s"}. Relations and child rows are not compared.</p>
    </div>
  );
}
