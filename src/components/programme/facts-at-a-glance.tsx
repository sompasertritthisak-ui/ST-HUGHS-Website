import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

export type FactRow = { icon: ComponentType<{ className?: string; strokeWidth?: number }>; label: string; value: ReactNode; sub?: ReactNode };

/**
 * "All facts at a glance" — the essentials of a programme in one scannable panel (management feedback: students and
 * parents should find what they need without reading long text). Missing facts say who confirms them; never guessed.
 */
export function FactsAtAGlance({ rows, footnote }: { rows: FactRow[]; footnote?: ReactNode }) {
  return (
    <section aria-labelledby="facts-title" className="rounded-[var(--radius-lg)] border border-line bg-bg-raised p-5 sm:p-8">
      <h2 id="facts-title" className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight text-fg">
        All facts at a glance
      </h2>
      <dl className="mt-5 grid border-t border-line-strong sm:grid-cols-2 sm:gap-x-10">
        {rows.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="grid grid-cols-[1.5rem_7rem_minmax(0,1fr)] items-start gap-x-3 border-b border-line py-4 sm:grid-cols-[1.5rem_8.5rem_minmax(0,1fr)]">
            <Icon aria-hidden className="mt-0.5 size-5 text-route" strokeWidth={1.75} />
            <dt className="text-[0.9375rem] font-semibold text-fg">{label}</dt>
            <dd className="min-w-0 text-[0.9375rem] leading-snug text-fg">
              {value}
              {sub ? <span className="mt-1 block text-[0.8125rem] leading-snug text-fg-muted">{sub}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
      {footnote ? <p className="mt-4 text-[0.8125rem] leading-relaxed text-fg-muted">{footnote}</p> : null}
    </section>
  );
}

export function FactLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="-my-3 inline-block py-3 font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-route">
      {children}
    </Link>
  );
}
