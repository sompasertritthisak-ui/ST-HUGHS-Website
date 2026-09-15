import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, description, crumbs = [], actions, badge }: { title: string; description?: string; crumbs?: { label: string; href: string }[]; actions?: ReactNode; badge?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {crumbs.length ? (
          <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">
            {crumbs.map((c) => (
              <span key={c.href} className="inline-flex items-center gap-1">
                <Link href={c.href} className="hover:text-fg">
                  {c.label}
                </Link>
                <ChevronRight className="size-3" strokeWidth={1.5} aria-hidden />
              </span>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="truncate font-display text-3xl leading-none text-fg">{title}</h1>
          {badge}
        </div>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
