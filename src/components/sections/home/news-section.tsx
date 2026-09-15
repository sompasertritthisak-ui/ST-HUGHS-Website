import type { Media, NewsArticle } from "@prisma/client";
import { NewsCard } from "@/components/cards/news-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";

type Article = NewsArticle & { heroMedia?: Media | null };

/** Act XI — News & insights. Three most recent public articles. */
export function NewsSection({ news }: { news: Article[] }) {
  return (
    <section aria-labelledby="news-title" className="border-t border-line bg-bg-raised">
      <div className="container-x section-y grid grid-cols-12 gap-x-8 gap-y-12">
        <div className="col-span-12 lg:col-span-3">
          <Reveal>
            <p className="eyebrow eyebrow-rule">News &amp; insights</p>
            <h2 id="news-title" className="font-display mt-6 text-[clamp(2rem,3.6vw,3rem)] leading-[1.02] text-fg text-balance">
              What has changed, and when
            </h2>
            <div className="mt-8">
              <Button href="/news" variant="ghost" arrow="right" className="text-sm">
                All news
              </Button>
            </div>
          </Reveal>
        </div>
        <div className="col-span-12 lg:col-span-9">
          {news.length > 0 ? (
            <div className="grid gap-x-8 gap-y-12 md:grid-cols-3">
              {news.map((a, i) => (
                <Reveal key={a.id} delay={i * 40}>
                  <NewsCard article={a} withImage={i === 0} className="h-full" />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title="No announcements yet" body="Approved announcements and insights are published here." />
          )}
        </div>
      </div>
    </section>
  );
}
