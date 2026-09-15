import Link from "next/link";
import { cn } from "@/lib/utils";

export type NextStep = { label: string; description?: string; href: string };

/** Curated list of next actions. The gold line lengthens on hover — the route continues. */
export function NextSteps({ items, className }: { items: NextStep[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item, i) => (
        <li key={item.href + item.label}>
          <Link href={item.href} className="group flex items-center justify-between gap-6 py-5">
            <span className="flex items-start gap-5">
              <span className="mt-1 font-mono text-[0.6875rem] tabular text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="block text-[1.0625rem] font-medium text-fg group-hover:text-gold-soft">{item.label}</span>
                {item.description ? <span className="mt-1 block text-sm text-fg-muted">{item.description}</span> : null}
              </span>
            </span>
            <span aria-hidden className="h-px w-8 shrink-0 bg-route transition-[width] duration-[var(--dur)] ease-[var(--ease-out)] group-hover:w-14" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
