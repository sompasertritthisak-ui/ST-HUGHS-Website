"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { TranslateMenu } from "./translate-menu";
import { lockScroll } from "./scroll-lock";
import { SearchButton, openSearch } from "@/components/search/search-dialog";

export type NavItem = { id: string; label: string; href: string; description?: string | null };

export function HeaderNav({ items, audience }: { items: NavItem[]; audience: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const audienceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setAudienceOpen(false);
  }, [pathname]);

  // Replay a tap made before hydration (see the inline script in header.tsx). setOpen(true), never a toggle, so a
  // click React itself replays during hydration cannot cancel it out.
  useEffect(() => {
    const w = window as Window & { __shvNavReady?: boolean; __shvPending?: "menu" | "search" };
    w.__shvNavReady = true;
    const pending = w.__shvPending;
    w.__shvPending = undefined;
    if (pending === "menu") setOpen(true);
    else if (pending === "search") window.setTimeout(() => openSearch(), 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // The drawer only exists below xl; close it if the window grows past that.
    const wide = window.matchMedia("(min-width: 1280px)");
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  useEffect(() => {
    if (!audienceOpen) return;
    const onDown = (e: MouseEvent) => {
      if (audienceRef.current && !audienceRef.current.contains(e.target as Node)) setAudienceOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAudienceOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [audienceOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <>
    <header className={cn("fixed inset-x-0 top-0 z-50 text-fg transition-[background-color,border-color,box-shadow] duration-[var(--dur)]", scrolled || open ? "glass-nav border-b border-line" : "bg-bg/95 border-b border-transparent")}>
      <div className="container-x flex h-[72px] items-center justify-between gap-3 sm:gap-5">
        <Logo tone="dark" />

        <nav aria-label="Primary" className="hidden xl:block">
          <ul className="flex items-center gap-4 min-[1600px]:gap-6">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative whitespace-nowrap py-2 text-[0.875rem] font-semibold text-fg/80 transition-colors duration-[var(--dur-fast)] hover:text-fg",
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-route after:transition-transform after:duration-[var(--dur)] after:ease-[var(--ease-out)] hover:after:scale-x-100",
                    isActive(item.href) && "text-fg after:scale-x-100",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex min-[1600px]:gap-3">
          <SearchButton />
          <TranslateMenu />
          <div ref={audienceRef} className="relative hidden min-[1700px]:block">
            <button
              type="button"
              aria-expanded={audienceOpen}
              aria-haspopup="menu"
              onClick={() => setAudienceOpen((v) => !v)}
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap px-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-fg/80 hover:text-fg"
            >
              I am a… <ChevronDown aria-hidden className={cn("size-3.5 transition-transform", audienceOpen && "rotate-180")} strokeWidth={1.75} />
            </button>
            {audienceOpen && (
              <div role="menu" className="surface-raised absolute right-0 top-12 w-80 rounded-[var(--radius)] p-2 anim-fade-up">
                {audience.map((a) => (
                  <Link key={a.id} role="menuitem" href={a.href} className="block rounded-[var(--radius-sm)] px-3 py-2.5 hover:bg-bg-hover">
                    <span className="block text-[0.9375rem] text-fg">{a.label}</span>
                    {a.description && <span className="mt-0.5 block text-xs text-fg-subtle">{a.description}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Button href="/consultation" size="sm">
            Talk to an advisor
          </Button>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
        <SearchButton compact className="md:hidden" />
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-strong text-fg"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
        </button>
        </div>
      </div>
    </header>

      {/* Mobile drawer — a sibling of <header>, never a child: the header's backdrop-filter would become the
          containing block for this fixed element and collapse it to the header's height (iOS Safari). */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 bottom-0 top-[72px] z-[45] overflow-y-auto overscroll-contain bg-bg transition-[opacity,transform,visibility] duration-[var(--dur)] ease-[var(--ease-out)] xl:hidden",
          open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-2 opacity-0",
        )}
        aria-hidden={!open}
        inert={!open}
        data-lenis-prevent
      >
        <div className="container-x flex min-h-full flex-col gap-7 py-6 sm:py-8">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openSearch();
            }}
            className="flex h-12 w-full items-center gap-3 rounded-full border border-line-strong px-4 text-left text-[0.9375rem] font-medium text-fg-subtle"
          >
            <Search aria-hidden className="size-4 shrink-0 text-route" strokeWidth={2} />
            <span className="truncate">Search the site…</span>
          </button>
          <nav aria-label="Primary mobile">
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} onClick={() => setOpen(false)} className="flex items-center justify-between py-3.5 font-display text-[1.625rem] text-fg sm:py-4 sm:text-[1.75rem]" aria-current={isActive(item.href) ? "page" : undefined}>
                    {item.label}
                    {isActive(item.href) && <span aria-hidden className="size-1.5 rounded-full bg-route" />}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="eyebrow eyebrow-rule mb-3">I am a…</p>
            <ul className="grid gap-1">
              {audience.map((a) => (
                <li key={a.id}>
                  <Link href={a.href} className="block rounded-[var(--radius-sm)] py-2 text-fg-muted hover:text-fg">
                    {a.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <TranslateMenu variant="drawer" />
          <div className="mt-auto grid gap-3 pb-[env(safe-area-inset-bottom)]">
            <Button href="/consultation" size="lg">
              Talk to an advisor
            </Button>
            <Button href="/pathway-explorer" variant="secondary" size="lg">
              Explore your pathway
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
