import type { Metadata } from "next";
import Link from "next/link";
import { getNews, getEvents } from "@/lib/content";
import { getNewsCategoriesInUse } from "@/lib/content-pages";
import { pageMetadata } from "@/lib/seo";
import { cn, formatDate } from "@/lib/utils";
import { NEWS_CATEGORY_LABELS, type NewsCategory } from "@/lib/enums";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { NewsCard } from "@/components/cards/news-card";
import { Section } from "@/components/pages";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: "News and insights",
  description: "Announcements, partnerships, academic updates and student success from St Hugh's College Vientiane.",
  path: "/news",
});

type Search = Promise<{ category?: string }>;

export default async function NewsPage({ searchParams }: { searchParams: Search }) {
  const { category } = await searchParams;
  const [articles, categories, events] = await Promise.all([getNews({ category: category || undefined }), getNewsCategoriesInUse(), getEvents({ upcoming: true })]);
  const [lead, ...rest] = articles;
  const chip = "inline-flex h-10 items-center rounded-[var(--radius-sm)] border px-3.5 text-sm transition-colors";

  return (
    <>
      <PageHero eyebrow="News and insights" title={<>What is <span className="italic text-gold-soft">happening.</span></>} lede="Announcements, partnerships and academic updates from the college — each article links to the programme or university it concerns." />

      <Section id="articles" eyebrow="Articles" title={category ? NEWS_CATEGORY_LABELS[category as NewsCategory] ?? category : "All articles"} layout="full">
        {categories.length > 1 ? (
          <nav aria-label="Filter by category" className="mb-12 border-y border-line py-6">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link href="/news#articles" className={cn(chip, !category ? "border-route text-gold-soft" : "border-line-strong text-fg-muted hover:border-fg hover:text-fg")} aria-current={!category ? "true" : undefined}>
                  All
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c}>
                  <Link href={`/news?category=${c}#articles`} className={cn(chip, category === c ? "border-route text-gold-soft" : "border-line-strong text-fg-muted hover:border-fg hover:text-fg")} aria-current={category === c ? "true" : undefined}>
                    {NEWS_CATEGORY_LABELS[c as NewsCategory] ?? c}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {articles.length ? (
          <div className="grid gap-x-8 gap-y-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <NewsCard article={lead} withImage />
            </Reveal>
            {rest.length ? (
              <div className="grid gap-10 lg:col-span-4 lg:col-start-9">
                {rest.map((a, i) => (
                  <Reveal key={a.id} delay={(i + 1) * 40}>
                    <NewsCard article={a} />
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState title="No articles in this category yet" body="Articles are published here as they are approved." action={category ? <Button href="/news" variant="secondary">All articles</Button> : undefined} />
        )}
      </Section>

      <Section eyebrow="Events" title="Upcoming events" layout="full">
        {events.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {events.map((e) => (
              <li key={e.id} className="grid gap-2 py-5 sm:grid-cols-12 sm:gap-6">
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-gold-soft sm:col-span-3">{formatDate(e.startsAt)}</span>
                <div className="sm:col-span-6">
                  <p className="text-[1.0625rem] font-medium text-fg">{e.title}</p>
                  {e.description ? <p className="mt-1 text-sm leading-relaxed text-fg-muted">{e.description}</p> : null}
                </div>
                <div className="text-sm text-fg-muted sm:col-span-3">
                  {e.isOnline ? "Online" : e.location ?? ""}
                  {e.registrationUrl ? (
                    <a href={e.registrationUrl} target="_blank" rel="noopener noreferrer" className="ml-3 text-gold-soft underline underline-offset-4">
                      Register
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Events are published here as they are confirmed" />
        )}
      </Section>

      <ConsultationBand title="Read something that fits your plan?" body="Explore the programmes behind the news, or talk to an advisor about what it means for your route." primaryHref="/programmes" primaryLabel="Explore programmes" secondaryHref="/consultation" secondaryLabel="Talk to an advisor" />
    </>
  );
}
