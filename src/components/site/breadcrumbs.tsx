import Link from "next/link";
import { breadcrumbListJsonLd } from "@/lib/seo";
import { JsonLd } from "./json-ld";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href: string };

/**
 * Breadcrumb trail for detail pages. The last item is the current page.
 * Emits BreadcrumbList JSON-LD alongside the visible nav.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={cn("container-x pt-8", className)}>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-3">
              {i > 0 ? <span aria-hidden className="h-px w-4 bg-route/60" /> : null}
              {last ? (
                <span aria-current="page" className="text-fg-muted">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="text-fg-subtle transition-colors hover:text-brand-soft">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd data={breadcrumbListJsonLd(trail)} />
    </nav>
  );
}
