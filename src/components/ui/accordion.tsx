import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

/** Native <details> accordion: accessible, keyboard-ready, zero JS. */
export function Accordion({ items, className }: { items: { id: string; title: ReactNode; content: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-[1.0625rem] font-medium text-fg marker:content-none [&::-webkit-details-marker]:hidden">
            <span>{item.title}</span>
            <Plus aria-hidden className="mt-1 size-4 shrink-0 text-brand-soft transition-transform duration-[var(--dur)] ease-[var(--ease-out)] group-open:rotate-45" strokeWidth={1.5} />
          </summary>
          <div className="pb-6 pr-10 text-fg-muted leading-relaxed">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
