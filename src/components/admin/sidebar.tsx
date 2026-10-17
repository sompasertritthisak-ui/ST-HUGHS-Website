"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays, ChartBar, ChartLine, Files, FileText, Globe, GraduationCap, Handshake, Image as ImageIcon, Inbox, LayoutDashboard, Megaphone, Menu, Navigation, Newspaper, Quote, Route, School, ScrollText, Settings, Sparkles, UserCog, Users, X, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup, NavIcon } from "./nav";

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard, pages: FileText, programmes: GraduationCap, pathways: Route, destinations: Globe, universities: School, partners: Handshake,
  stories: Quote, faculty: Users, facilities: Sparkles, metrics: ChartBar, news: Newspaper, events: CalendarDays, faqs: Files, documents: Files, media: ImageIcon,
  enquiries: Inbox, campaigns: Megaphone, analytics: ChartLine, navigation: Navigation, settings: Settings, users: UserCog, audit: ScrollText,
};

/**
 * CMS sidebar: the deep-blue brand panel with the white lockup, grouped navigation with icons, and
 * the signed-in person at the foot. Collapses to a drawer below the lg breakpoint.
 */
export function Sidebar({ groups, user }: { groups: NavGroup[]; user?: { name: string; email: string; roleLabel: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  const initials = (user?.name || user?.email || "?")
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-sidebar"
        className="fixed left-4 top-2.5 z-30 inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-bg-raised text-fg shadow-sm lg:hidden"
      >
        {open ? <X className="size-5" strokeWidth={1.5} aria-hidden /> : <Menu className="size-5" strokeWidth={1.5} aria-hidden />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>
      {open ? <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-ink/40 lg:hidden" /> : null}
      <aside
        id="admin-sidebar"
        className={cn(
          "theme-dark fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col bg-midnight text-fg transition-transform duration-[var(--dur)] ease-[var(--ease-out)] lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(120%_80%_at_50%_0%,rgb(27_52_153/0.55)_0%,transparent_70%)]" />
        <div className="relative flex h-[76px] items-center justify-between border-b border-white/10 px-5">
          <Link href="/admin" className="notranslate inline-flex items-center" translate="no" aria-label="St Hugh's College Vientiane CMS — dashboard">
            <Image src="/brand/shv-lockup-white.png" alt="St Hugh's College Vientiane" width={1600} height={405} className="h-9 w-auto" sizes="160px" priority />
          </Link>
          <span className="rounded-full border border-white/20 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-white/70">CMS</span>
        </div>
        <nav aria-label="Admin" className="relative flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
          {groups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-3 pb-2 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-white/40">{group.label}</p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = ICONS[item.icon];
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex h-10 items-center gap-3 rounded-[var(--radius)] px-3 text-[0.9375rem] transition-colors duration-[var(--dur-fast)]",
                          active ? "bg-white text-midnight shadow-[0_6px_18px_-10px_rgb(0_0_0/0.6)]" : "text-white/75 hover:bg-white/8 hover:text-white",
                        )}
                      >
                        {active ? <span aria-hidden className="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-route" /> : null}
                        <Icon className={cn("size-[18px] shrink-0", active ? "text-brand" : "text-white/55 group-hover:text-white/85")} strokeWidth={1.6} aria-hidden />
                        <span className={cn(active && "font-semibold")}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        {user ? (
          <div className="relative border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-[var(--radius)] bg-white/6 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-[0.75rem] font-medium tracking-[0.08em] text-white">{initials}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.name || user.email}</p>
                <p className="truncate font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-white/55">{user.roleLabel}</p>
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
