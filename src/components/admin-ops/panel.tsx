import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ title, description, actions, children, className, as: Tag = "section" }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return (
    <Tag className={cn("rounded-[var(--radius)] border border-line bg-bg-raised shadow-sm", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            {title ? <h2 className="text-sm font-semibold text-fg">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs text-fg-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </Tag>
  );
}

/** Label/value pair for detail views. */
export function Dl({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2 text-sm", className)}>
      {items.map((it) => (
        <div key={it.label} className="contents">
          <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted leading-6">{it.label}</dt>
          <dd className="min-w-0 break-words text-fg">{it.value === null || it.value === undefined || it.value === "" ? <span className="text-fg-subtle">—</span> : it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
