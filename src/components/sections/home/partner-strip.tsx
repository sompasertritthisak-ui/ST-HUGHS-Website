import Link from "next/link";

export type PartnerItem = { slug: string; name: string; logo?: string | null; country?: string | null };

/**
 * University partners, as logos (management feedback: show the range of options at a glance, right under the globe).
 * A university without an uploaded logo (CMS → Universities → Logo) shows its name instead — never a guessed logo.
 * Phones and tablets: one swipeable row. Wide screens (1280px+): a single line beside the label.
 */
export function PartnerStrip({ items }: { items: PartnerItem[] }) {
  if (!items.length) return null;
  return (
    <div className="border-b border-line bg-bg">
      <div className="container-x flex items-center gap-6 py-5 max-xl:flex-col max-xl:items-start max-xl:gap-3">
        <p className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">
          <span className="text-fg">100+ universities</span> through NCUK · plus our direct partners
        </p>
        <ul
          data-lenis-prevent
          className="flex min-w-0 flex-1 items-center gap-x-8 gap-y-4 xl:flex-wrap xl:justify-end max-xl:-mx-[var(--gutter)] max-xl:w-[calc(100%+2*var(--gutter))] max-xl:overflow-x-auto max-xl:px-[var(--gutter)] max-xl:pb-1 max-xl:[scrollbar-width:none]"
        >
          {items.map((u) => (
            <li key={u.slug} className="shrink-0">
              <Link href={`/universities/${u.slug}`} className="group flex h-11 items-center gap-2.5" title={u.country ? `${u.name}, ${u.country}` : u.name}>
                {u.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- partner logos of mixed shapes from the CMS
                  <img src={u.logo} alt={u.name} className="h-10 w-auto max-w-[8rem] object-contain opacity-80 grayscale transition-[filter,opacity] duration-[var(--dur)] group-hover:opacity-100 group-hover:grayscale-0" />
                ) : (
                  <span className="whitespace-nowrap font-display text-[1.125rem] leading-none text-fg/75 transition-colors group-hover:text-fg">{u.name.replace(/\s*\((network|NUOL)\)\s*/i, " ").trim()}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
