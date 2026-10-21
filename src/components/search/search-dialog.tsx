"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchResults, SEARCH_SUGGESTIONS, type PublicHit } from "./search-results";
import { lockScroll } from "@/components/site/scroll-lock";

const OPEN_EVENT = "shv:open-search";

/** Open the site search from anywhere (header button, drawer, 404 page…). */
export function openSearch(initial?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: initial ?? "" }));
}

/** Header trigger. `compact` = icon only (phones); otherwise icon + label + shortcut hint. */
export function SearchButton({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openSearch()}
      aria-label="Search the site"
      aria-haspopup="dialog"
      className={cn(
        compact
          ? "inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-strong text-fg"
          : "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-line-strong px-2.5 text-[0.8125rem] font-semibold text-fg/80 transition-colors hover:border-fg/40 hover:text-fg min-[1700px]:px-3.5",
        className,
      )}
    >
      <Search aria-hidden className={compact ? "size-5" : "size-4"} strokeWidth={compact ? 1.5 : 2} />
      {compact ? null : (
        <>
          <span className="hidden min-[1700px]:inline">Search</span>
          <kbd className="hidden rounded border border-line px-1.5 py-px text-[0.6875rem] font-semibold text-fg-subtle min-[1800px]:inline">/</kbd>
        </>
      )}
    </button>
  );
}

/** One dialog per page, mounted once in the site layout. Portalled to <body> so no ancestor can clip it. */
export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<PublicHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    restoreFocus.current?.focus?.();
  }, []);

  // Open via event, "/" or Cmd/Ctrl+K.
  useEffect(() => {
    const onOpen = (e: Event) => {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      const initial = (e as CustomEvent<string>).detail;
      if (initial) setQ(initial);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        restoreFocus.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(t);
      unlock();
    };
  }, [open]);

  // Debounced fetch; stale responses are ignored.
  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 2) {
      setHits([]);
      setLoading(false);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        const json = (await res.json()) as { ok: boolean; hits?: PublicHit[]; error?: string };
        if (!json.ok) throw new Error(json.error ?? "Search failed");
        setHits(json.hits ?? []);
        setActive(0);
        setError(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Search is unavailable right now. Please try again.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 160);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [q, open]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" && hits.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp" && hits.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hits[active]) go(hits[active].href);
      else if (q.trim().length >= 2) go(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  // Keep the highlighted result in view while arrowing.
  useEffect(() => {
    const h = hits[active];
    if (!h) return;
    document.getElementById(`sd-${encodeURIComponent(h.href + h.title)}`)?.scrollIntoView({ block: "nearest" });
  }, [active, hits]);

  if (!mounted || !open) return null;
  const query = q.trim();

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Search St Hugh's College Vientiane">
      <button type="button" aria-label="Close search" tabIndex={-1} onClick={close} className="absolute inset-0 bg-[#0b1640]/45 anim-fade-in" />
      <div
        data-lenis-prevent
        onKeyDown={onKeyDown}
        className="absolute inset-x-0 top-0 flex max-h-[100dvh] flex-col bg-bg shadow-[0_30px_80px_-20px_rgb(11_22_64/0.45)] anim-fade-up sm:inset-x-4 sm:top-[8vh] sm:mx-auto sm:max-h-[80vh] sm:max-w-2xl sm:rounded-[var(--radius-lg)] sm:border sm:border-line"
      >
        <div className="flex items-center gap-3 border-b-2 border-line px-4 pb-3 transition-colors focus-within:border-route pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-3">
          {loading ? <Loader2 aria-hidden className="size-5 shrink-0 animate-spin text-route" /> : <Search aria-hidden className="size-5 shrink-0 text-route" strokeWidth={2} />}
          <input
            ref={inputRef}
            type="search"
            data-bare
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search programmes, universities, fees…"
            aria-label="Search"
            aria-controls="search-dialog-results"
            className="h-12 min-w-0 flex-1 bg-transparent text-[1.0625rem] font-medium text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }} className="rounded-full px-2 py-1 text-[0.8125rem] font-semibold text-fg-muted hover:text-fg">
              Clear
            </button>
          ) : null}
          <button type="button" onClick={close} aria-label="Close search" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-bg-hover hover:text-fg">
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div id="search-dialog-results" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          {query.length < 2 ? (
            <div>
              <p className="eyebrow eyebrow-rule mb-3">Popular searches</p>
              <ul className="flex flex-wrap gap-2">
                {SEARCH_SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => setQ(s)} className="rounded-full border border-line-strong px-3.5 py-2 text-[0.875rem] font-semibold text-fg transition-colors hover:border-route hover:text-route">
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : error ? (
            <p className="text-[0.9375rem] text-fg-muted">{error}</p>
          ) : hits.length ? (
            <SearchResults hits={hits} activeHref={hits[active]?.href} onNavigate={close} idPrefix="sd" />
          ) : loading ? (
            <p className="text-[0.9375rem] text-fg-muted">Searching…</p>
          ) : (
            <div className="grid gap-3">
              <p className="text-[1rem] font-semibold text-fg">No results for “{query}”.</p>
              <p className="text-[0.9375rem] text-fg-muted">
                Try a shorter word, or{" "}
                <Link href="/consultation" onClick={close} className="font-semibold text-route underline-offset-4 hover:underline">
                  ask an advisor
                </Link>{" "}
                — they answer every question.
              </p>
            </div>
          )}
        </div>

        {query.length >= 2 && hits.length ? (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[0.8125rem] sm:px-5">
            <span className="hidden items-center gap-1.5 text-fg-subtle sm:inline-flex">
              <CornerDownLeft aria-hidden className="size-3.5" /> to open · ↑ ↓ to move · Esc to close
            </span>
            <Link href={`/search?q=${encodeURIComponent(query)}`} onClick={close} className="font-semibold text-route underline-offset-4 hover:underline">
              See all results
            </Link>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
