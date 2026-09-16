"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { TranslateMenu } from "./translate-menu";

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
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
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-[var(--dur)]", scrolled || open ? "glass-nav border-b border-line" : "border-b border-transparent")}>
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Primary" className="hidden xl:block">
          <ul className="flex items-center gap-6 2xl:gap-7">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative whitespace-nowrap py-2 text-[0.9375rem] text-fg-muted transition-colors duration-[var(--dur-fast)] hover:text-fg",
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

        <div className="hidden items-center gap-3 md:flex">
          <TranslateMenu />
          <div ref={audienceRef} className="relative">
            <button
              type="button"
              aria-expanded={audienceOpen}
              aria-haspopup="menu"
              onClick={() => setAudienceOpen((v) => !v)}
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap px-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted hover:text-fg"
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

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-strong text-fg xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" strokeWidth={1.5} /> : <Menu className="size-5" strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-bg transition-[opacity,transform] duration-[var(--dur)] ease-[var(--ease-out)] xl:hidden",
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="container-x flex min-h-full flex-col gap-8 py-8">
          <nav aria-label="Primary mobile">
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-center justify-between py-4 font-display text-[1.75rem] text-fg" aria-current={isActive(item.href) ? "page" : undefined}>
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
    </header>
  );
}
