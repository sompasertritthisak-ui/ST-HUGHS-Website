import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, lede, actions, className }: { eyebrow: string; title: ReactNode; lede?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5", className)}>
      <div className="min-w-0">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg-muted">{eyebrow}</p>
        <h1 className="font-display mt-1 text-[clamp(1.75rem,3vw,2.5rem)] text-fg">{title}</h1>
        {lede ? <p className="mt-2 max-w-2xl text-sm text-fg-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted", className)}>{children}</span>;
}
