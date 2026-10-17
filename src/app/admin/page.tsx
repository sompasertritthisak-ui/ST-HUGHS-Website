import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleCheck, Clock, FileText, GraduationCap, Image as ImageIcon, Inbox, Newspaper, Route, TriangleAlert } from "lucide-react";
import { CONTENT_STATUSES, CONTENT_STATUS_LABELS } from "@/lib/enums";
import { can } from "@/lib/rbac";
import { formatDate, formatDateTime } from "@/lib/utils";
import { requireUser } from "@/lib/admin/session";
import { awaitingApproval, recentAudit, reviewOverdue, scheduledSoon, statusCountsByEntity, type FlaggedItem } from "@/lib/admin/dashboard";
import { entityHref } from "@/lib/admin/registry";
import { Panel } from "@/components/admin/primitives";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-[#EEF1F7] text-[#3A4675]",
  IN_REVIEW: "bg-[#FFF3DC] text-[#8A5A00]",
  APPROVED: "bg-[#E6ECFB] text-[#103090]",
  PUBLISHED: "bg-[#E3F4EB] text-[#1E7A4F]",
  ARCHIVED: "bg-[#F2F2F4] text-[#6B7390]",
};

function greeting() {
  const h = new Date().getUTCHours() + 7; // Vientiane, UTC+7
  const hour = ((h % 24) + 24) % 24;
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function FlagList({ items, empty, icon }: { items: FlaggedItem[]; empty: string; icon: React.ReactNode }) {
  if (items.length === 0)
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius)] bg-[#F5F7FC] px-4 py-3 text-sm text-fg-muted">
        <CircleCheck className="size-4 text-success" strokeWidth={1.6} aria-hidden />
        {empty}
      </div>
    );
  return (
    <ul className="divide-y divide-line">
      {items.map((i) => (
        <li key={`${i.def.key}-${i.id}`}>
          <Link href={entityHref(i.def, i.id)} className="group -mx-2 flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-2.5 text-sm transition-colors hover:bg-[#F5F7FC]">
            <span className="min-w-0 truncate font-medium text-fg">{i.title}</span>
            <span className="flex shrink-0 items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">
              <span className="rounded-full border border-line px-2 py-0.5">{i.def.labelSingular}</span>
              {i.date ? (
                <span className="inline-flex items-center gap-1">
                  {icon}
                  {formatDate(i.date, { month: "short" })}
                </span>
              ) : null}
              <ArrowUpRight className="size-3.5 text-fg-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.6} aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, hint, tone = "ink", href }: { label: string; value: number; hint: string; tone?: "ink" | "red" | "amber" | "blue"; href?: string }) {
  const color = tone === "red" ? "text-brand-deep" : tone === "amber" ? "text-[#8A5A00]" : tone === "blue" ? "text-blue" : "text-fg";
  const inner = (
    <>
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">{label}</p>
      <p className={`font-display mt-3 text-[2.75rem] leading-none tabular ${color}`}>{String(value).padStart(2, "0")}</p>
      <p className="mt-2 text-sm text-fg-muted">{hint}</p>
    </>
  );
  const cls = "block rounded-[var(--radius-lg)] border border-line/80 bg-bg-raised p-5 shadow-[0_1px_2px_rgb(11_19_80/0.04),0_12px_32px_-20px_rgb(11_19_80/0.25)] transition-[transform,box-shadow] duration-[var(--dur)] hover:-translate-y-0.5";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [counts, inReview, overdue, scheduled, audit] = await Promise.all([statusCountsByEntity(), awaitingApproval(), reviewOverdue(), scheduledSoon(), can(user.role, "audit.read") ? recentAudit(10) : Promise.resolve([])]);
  const canApprove = can(user.role, "content.approve");
  const published = counts.reduce((a, c) => a + (c.counts.PUBLISHED ?? 0), 0);
  const drafts = counts.reduce((a, c) => a + (c.counts.DRAFT ?? 0), 0);
  const firstName = (user.name || user.email).replace(/^(Mr|Ms|Mrs|Dr)\.?\s*/i, "").split(/\s+/)[0];
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Vientiane" }).format(new Date());

  const quick = [
    can(user.role, "content.create") && { href: "/admin/news/new", label: "New article", Icon: Newspaper },
    can(user.role, "content.create") && { href: "/admin/programmes/new", label: "New programme", Icon: GraduationCap },
    can(user.role, "content.create") && { href: "/admin/pathways/new", label: "New pathway", Icon: Route },
    can(user.role, "media.upload") && { href: "/admin/media", label: "Upload media", Icon: ImageIcon },
    can(user.role, "enquiries.read") && { href: "/admin/enquiries", label: "Enquiries", Icon: Inbox },
    can(user.role, "content.read") && { href: "/admin/pages", label: "Pages", Icon: FileText },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Newspaper }[];

  return (
    <>
      {/* Welcome band */}
      <section className="theme-dark relative mb-8 overflow-hidden rounded-[var(--radius-lg)] bg-midnight px-6 py-7 text-fg shadow-[0_24px_48px_-28px_rgb(11_19_80/0.6)] sm:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_100%_0%,rgb(27_52_153/0.7)_0%,transparent_60%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 size-[22rem] rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -right-4 -top-12 size-[22rem] rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-brand-soft">{today}</p>
            <h1 className="font-display mt-3 text-[clamp(2rem,3.4vw,2.75rem)] leading-none text-white">
              {greeting()}, {firstName}.
            </h1>
            <p className="mt-3 max-w-xl text-[0.9375rem] text-white/75">
              {canApprove ? "Items awaiting your approval are listed first. Everything you publish here is live on the site within five minutes." : "This overview is read-only for your role."}
            </p>
          </div>
          {quick.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {quick.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/8 px-4 text-sm text-white transition-colors hover:border-white hover:bg-white hover:text-midnight">
                    <Icon className="size-4" strokeWidth={1.6} aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Published" value={published} hint="Live items across the site" tone="blue" />
        <Stat label={canApprove ? "Awaiting approval" : "In review"} value={inReview.length} hint={inReview.length ? "Open the queue below" : "Queue is clear"} tone={inReview.length ? "red" : "ink"} />
        <Stat label="Review overdue" value={overdue.length} hint={overdue.length ? "Past their review date" : "Nothing overdue"} tone={overdue.length ? "amber" : "ink"} />
        <Stat label="Drafts" value={drafts} hint="Unpublished work in progress" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title={canApprove ? "Awaiting approval" : "In review"} description="Newest first. Open an item to review and publish it." className="lg:col-span-2">
          <FlagList items={inReview} empty="Nothing is waiting for review." icon={<Clock className="size-3" strokeWidth={1.6} aria-hidden />} />
        </Panel>
        <Panel title="Review overdue" description="Content past the review date set on it.">
          <FlagList items={overdue} empty="No content is past its review date." icon={<TriangleAlert className="size-3 text-warning" strokeWidth={1.6} aria-hidden />} />
        </Panel>

        <Panel title="Content by status" description="Click a count to open that list." className="lg:col-span-2" padded={false}>
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-fg-subtle">
                  <th scope="col" className="px-3 py-2 text-left font-normal">Type</th>
                  {CONTENT_STATUSES.map((s) => (
                    <th key={s} scope="col" className="px-3 py-2 text-right font-normal">
                      {CONTENT_STATUS_LABELS[s]}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {counts.map(({ def, counts: c, total }) => (
                  <tr key={def.key} className="border-t border-line/70 transition-colors hover:bg-[#F5F7FC]">
                    <th scope="row" className="px-3 py-2.5 text-left font-medium">
                      <Link href={entityHref(def)} className="hover:text-blue">
                        {def.label}
                      </Link>
                    </th>
                    {CONTENT_STATUSES.map((s) => (
                      <td key={s} className="px-3 py-2.5 text-right">
                        {c[s] ? (
                          <Link href={`${entityHref(def)}?status=${s}`} className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 font-mono text-[0.6875rem] tabular ${STATUS_TONE[s] ?? ""}`}>
                            {c[s]}
                          </Link>
                        ) : (
                          <span className="text-fg-subtle/60">·</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right font-semibold tabular">{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Scheduled" description="Publishing at a set date and time.">
          <FlagList items={scheduled} empty="Nothing is scheduled." icon={<CalendarDays className="size-3" strokeWidth={1.6} aria-hidden />} />
        </Panel>

        {can(user.role, "audit.read") ? (
          <Panel title="Recent activity" description="Who changed what, most recent first." className="lg:col-span-3" action={<Link href="/admin/audit" className="text-sm font-medium text-blue hover:underline">Full audit log</Link>}>
            {audit.length === 0 ? (
              <p className="text-sm text-fg-muted">No activity recorded yet.</p>
            ) : (
              <ol className="relative ml-2 border-l border-line pl-5">
                {audit.map((a) => (
                  <li key={a.id} className="relative py-2 text-sm">
                    <span aria-hidden className="absolute -left-[1.45rem] top-[0.95rem] size-2 rounded-full border-2 border-route bg-bg-raised" />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="rounded-full bg-[#EEF1F7] px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-[#3A4675]">{a.action}</span>
                      <span className="font-medium">{a.entityType}</span>
                      {a.entityId ? <span className="font-mono text-xs text-fg-subtle">{a.entityId.slice(0, 10)}…</span> : null}
                      <span className="text-fg-muted">by {a.actor?.name ?? "system"}</span>
                      <span className="ml-auto tabular text-fg-subtle">{formatDateTime(a.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        ) : null}
      </div>
    </>
  );
}
