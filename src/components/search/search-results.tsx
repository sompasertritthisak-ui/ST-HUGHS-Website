import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupHits, type SearchHit } from "@/lib/search/core";

export type PublicHit = Pick<SearchHit, "kind" | "title" | "href" | "summary" | "meta"> & { score?: number };

/** Grouped search results. Presentational only, so the header dialog (client) and /search (server) share it. */
export function SearchResults({
  hits,
  activeHref,
  onNavigate,
  idPrefix = "sr",
}: {
  hits: PublicHit[];
  activeHref?: string | null;
  onNavigate?: () => void;
  idPrefix?: string;
}) {
  const groups = groupHits(hits.map((h) => ({ ...h, score: h.score ?? 0 })));
  return (
    <div className="grid gap-7">
      {groups.map((g) => (
        <section key={g.kind} aria-label={g.label}>
          <h3 className="eyebrow eyebrow-rule mb-2">{g.label}</h3>
          <ul role="listbox" aria-label={g.label} className="divide-y divide-line border-y border-line">
            {g.hits.map((h) => {
              const active = activeHref === h.href;
              return (
                <li key={`${h.kind}:${h.href}:${h.title}`} role="option" aria-selected={active} id={`${idPrefix}-${encodeURIComponent(h.href + h.title)}`}>
                  <Link
                    href={h.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-start justify-between gap-4 px-2 py-3.5 transition-colors duration-[var(--dur-fast)] hover:bg-bg-hover sm:px-3",
                      active && "bg-bg-hover",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-[1rem] font-semibold leading-snug text-fg">{h.title}</span>
                      {h.meta ? <span className="mt-0.5 block text-[0.8125rem] font-medium text-route">{h.meta}</span> : null}
                      {h.summary ? <span className="mt-1 line-clamp-2 block text-[0.875rem] leading-relaxed text-fg-muted">{h.summary}</span> : null}
                    </span>
                    <ArrowUpRight aria-hidden className={cn("mt-1 size-4 shrink-0 text-fg-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-route", active && "text-route")} strokeWidth={1.75} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export const SEARCH_SUGGESTIONS = ["Foundation Year", "Entry requirements", "Fees", "Check your eligibility", "UK universities", "Intensive English", "BBA", "Book a tour"];
