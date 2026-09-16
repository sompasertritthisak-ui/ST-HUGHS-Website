import { cn } from "@/lib/utils";

/** Verified-only statistic. Shows an explicit pending state rather than a made-up number. */
export function Stat({ label, value, unit, sourceNote, verified, className }: { label: string; value?: string | null; unit?: string | null; sourceNote?: string | null; verified: boolean; className?: string }) {
  const show = verified && value;
  return (
    <div className={cn("border-t border-line pt-5", className)}>
      <div className="font-display text-[clamp(2.5rem,4vw,3.75rem)] leading-none text-fg tabular">
        {show ? (
          <>
            {value}
            {unit ? <span className="ml-1 text-[0.5em] text-brand-soft">{unit}</span> : null}
          </>
        ) : (
          <span className="text-fg-subtle">—</span>
        )}
      </div>
      <div className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted">{label}</div>
      {!show ? <div className="mt-1 text-xs text-fg-subtle">Verified figure pending</div> : sourceNote ? <div className="mt-1 text-xs text-fg-subtle">{sourceNote}</div> : null}
    </div>
  );
}
