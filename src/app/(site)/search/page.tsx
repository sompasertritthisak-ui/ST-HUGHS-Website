import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchSite } from "@/lib/search";
import { SearchResults, SEARCH_SUGGESTIONS } from "@/components/search/search-results";
import { CtaTrio } from "@/components/ui/cta-trio";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Search",
  description: "Search programmes, pathways, universities, destinations and answers at St Hugh's College Vientiane.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, 120);
  const hits = q.length >= 2 ? await searchSite(q, 60) : [];

  return (
    <div className="container-x pb-24 pt-10 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow eyebrow-rule">Search</p>
        <h1 className="mt-4 font-display text-[clamp(2.25rem,7vw,4rem)] text-fg">{q ? <>Results for “{q}”</> : "Find what you need"}</h1>

        <form action="/search" role="search" className="mt-8 flex items-center gap-2 rounded-full border border-line-strong bg-bg pl-4 pr-1.5 focus-within:border-route">
          <Search aria-hidden className="size-5 shrink-0 text-route" strokeWidth={2} />
          <input
            type="search"
            data-bare
            name="q"
            defaultValue={q}
            placeholder="Search programmes, universities, fees…"
            aria-label="Search the site"
            enterKeyHint="search"
            className="h-12 min-w-0 flex-1 bg-transparent text-[1rem] font-medium text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none"
          />
          <Button type="submit" size="sm" className="shrink-0 rounded-full">
            Search
          </Button>
        </form>

        <div className="mt-10">
          {q.length >= 2 ? (
            hits.length ? (
              <>
                <p className="mb-6 text-[0.875rem] font-medium text-fg-muted">
                  {hits.length} {hits.length === 1 ? "result" : "results"}
                </p>
                <SearchResults hits={hits} />
              </>
            ) : (
              <div className="grid gap-3">
                <p className="text-[1.0625rem] font-semibold text-fg">Nothing matched “{q}”.</p>
                <p className="text-fg-muted">Try a shorter or different word. Our advisors can also answer any question directly.</p>
              </div>
            )
          ) : (
            <div>
              <p className="eyebrow eyebrow-rule mb-3">Popular searches</p>
              <ul className="flex flex-wrap gap-2">
                {SEARCH_SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <Link href={`/search?q=${encodeURIComponent(s)}`} className="inline-block rounded-full border border-line-strong px-3.5 py-2 text-[0.875rem] font-semibold text-fg hover:border-route hover:text-route">
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-16 border-t border-line pt-10">
          <p className="mb-5 text-[1rem] font-semibold text-fg">Prefer to talk it through?</p>
          <CtaTrio />
        </div>
      </div>
    </div>
  );
}
