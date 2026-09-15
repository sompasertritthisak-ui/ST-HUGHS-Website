import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { NAV_MENUS } from "@/lib/enums";
import { deleteNavigationItem, moveNavigationItem, toggleNavigationVisibility } from "@/lib/admin-ops/navigation-actions";
import { sp } from "@/lib/admin-ops/form";
import { cn } from "@/lib/utils";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Panel } from "@/components/admin-ops/panel";
import { NavItemForm } from "@/components/admin-ops/navigation-form";

export const metadata: Metadata = { title: "Navigation · SHV CMS", description: "Header, footer, legal and audience menus." };
export const dynamic = "force-dynamic";

const MENU_LABELS: Record<(typeof NAV_MENUS)[number], string> = { HEADER: "Header", FOOTER: "Footer", LEGAL: "Legal", AUDIENCE: "Audience" };

type SP = Record<string, string | string[] | undefined>;
type Item = { id: string; menu: string; label: string; href: string; order: number; parentId: string | null; description: string | null; isVisible: boolean };

const iconBtn = "inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-line-strong text-fg-muted hover:bg-bg-hover hover:text-fg disabled:opacity-30";

function ItemRow({ item, index, total, menu, parents }: { item: Item; index: number; total: number; menu: string; parents: { id: string; label: string }[] }) {
  return (
    <li className="rounded-[var(--radius-sm)] border border-line bg-bg-raised">
      <div className="flex flex-wrap items-center gap-3 px-3 py-2">
        <span className="tabular w-6 font-mono text-xs text-fg-subtle">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-medium", item.isVisible ? "text-fg" : "text-fg-muted line-through")}>{item.label}</p>
          <p className="truncate font-mono text-xs text-fg-muted">
            {item.href}
            {item.description ? <span className="ml-2 font-sans text-fg-subtle">— {item.description}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <form action={moveNavigationItem}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" className={iconBtn} disabled={index === 0} aria-label={`Move ${item.label} up`}>
              <ArrowUp aria-hidden className="size-4" strokeWidth={1.75} />
            </button>
          </form>
          <form action={moveNavigationItem}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" className={iconBtn} disabled={index === total - 1} aria-label={`Move ${item.label} down`}>
              <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
            </button>
          </form>
          <form action={toggleNavigationVisibility}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className={iconBtn} aria-label={item.isVisible ? `Hide ${item.label}` : `Show ${item.label}`} aria-pressed={item.isVisible}>
              {item.isVisible ? <Eye aria-hidden className="size-4" strokeWidth={1.75} /> : <EyeOff aria-hidden className="size-4" strokeWidth={1.75} />}
            </button>
          </form>
          <form action={deleteNavigationItem}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className={cn(iconBtn, "hover:text-danger")} aria-label={`Delete ${item.label}`}>
              <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
            </button>
          </form>
          <NavItemForm item={item} menu={menu} parents={parents} compactMode />
        </div>
      </div>
    </li>
  );
}

export default async function NavigationPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "navigation.update")) return <AccessDenied area="navigation" />;

  const params = await searchParams;
  const raw = sp(params, "menu");
  const menu = (NAV_MENUS as readonly string[]).includes(raw ?? "") ? (raw as (typeof NAV_MENUS)[number]) : "HEADER";

  const items: Item[] = await prisma.navigationItem.findMany({ where: { menu, locale: "en" }, orderBy: [{ order: "asc" }, { label: "asc" }] });
  const roots = items.filter((i) => !i.parentId);
  const childrenOf = (id: string) => items.filter((i) => i.parentId === id);
  const parents = roots.map((r) => ({ id: r.id, label: r.label }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Site structure" title="Navigation" lede="Menus are read live by the public site. Hidden items stay in place but are not rendered. Header items can nest one level." />
      <nav aria-label="Menus" className="flex flex-wrap gap-1 border-b border-line">
        {NAV_MENUS.map((m) => (
          <Link key={m} href={`/admin/navigation?menu=${m}`} aria-current={m === menu ? "page" : undefined} className={cn("-mb-px inline-flex h-11 items-center border-b-2 px-4 text-sm", m === menu ? "border-route font-medium text-fg" : "border-transparent text-fg-muted hover:text-fg")}>
            {MENU_LABELS[m]}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <section aria-label={`${MENU_LABELS[menu]} items`}>
          {roots.length === 0 ? (
            <p className="rounded-[var(--radius)] border border-dashed border-line-strong p-8 text-center text-sm text-fg-muted">No items in this menu yet.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {roots.map((r, i) => {
                const kids = childrenOf(r.id);
                return (
                  <li key={r.id}>
                    <ul>
                      <ItemRow item={r} index={i} total={roots.length} menu={menu} parents={parents} />
                    </ul>
                    {kids.length ? (
                      <ol className="ml-8 mt-2 flex flex-col gap-2 border-l border-route pl-3" aria-label={`Children of ${r.label}`}>
                        {kids.map((k, j) => (
                          <ItemRow key={k.id} item={k} index={j} total={kids.length} menu={menu} parents={parents} />
                        ))}
                      </ol>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
        <aside>
          <Panel title={`Add to ${MENU_LABELS[menu].toLowerCase()} menu`}>
            <NavItemForm menu={menu} parents={parents} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}
