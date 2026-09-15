import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function EmptyState({ title, body, action, className }: { title: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[var(--radius)] border border-dashed border-line-strong p-8 text-center", className)}>
      <p className="font-display text-2xl text-fg">{title}</p>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
