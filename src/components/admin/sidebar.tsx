"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup } from "./nav";

export function Sidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-sidebar"
        className="fixed left-4 top-1.5 z-30 inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line bg-bg-raised text-fg lg:hidden"
      >
        {open ? <X className="size-5" strokeWidth={1.5} aria-hidden /> : <Menu className="size-5" strokeWidth={1.5} aria-hidden />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>
      {open ? <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-ink/30 lg:hidden" /> : null}
      <aside
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-bg-raised transition-transform duration-[var(--dur)] ease-[var(--ease-out)] lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-3 border-b border-line px-5">
          <span aria-hidden className="h-px w-6 bg-route" />
          <Link href="/admin" className="font-display text-xl leading-none text-fg">
            St Hugh&rsquo;s <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">CMS</span>
          </Link>
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-2 pb-1.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">{group.label}</p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex h-9 items-center rounded-[var(--radius-sm)] px-2.5 text-[0.9375rem] transition-colors duration-[var(--dur-fast)]",
                          active ? "bg-bg-hover font-medium text-fg" : "text-fg-muted hover:bg-bg-hover hover:text-fg",
                        )}
                      >
                        {active ? <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-route" /> : null}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
