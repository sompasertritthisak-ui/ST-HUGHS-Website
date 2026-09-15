import Link from "next/link";
import type { Media, NewsArticle } from "@prisma/client";
import { NEWS_CATEGORY_LABELS, type NewsCategory } from "@/lib/enums";
import { formatDate, cn } from "@/lib/utils";
import { Plate } from "@/components/ui/plate";

export function NewsCard({ article, className, withImage = false }: { article: NewsArticle & { heroMedia?: Media | null }; className?: string; withImage?: boolean }) {
  return (
    <Link href={`/news/${article.slug}`} className={cn("group flex flex-col gap-4 border-t border-line pt-5 transition-colors hover:border-route", className)}>
      {withImage ? <Plate media={article.heroMedia} slot="News hero" aspect="16/9" sizes="(min-width:1024px) 33vw, 90vw" /> : null}
      <div className="flex items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
        <span className="text-gold-soft">{NEWS_CATEGORY_LABELS[article.category as NewsCategory] ?? article.category}</span>
        <span className="text-fg-subtle">{formatDate(article.publishedAt)}</span>
      </div>
      <h3 className="text-[1.25rem] font-medium leading-snug text-fg text-balance group-hover:text-gold-soft">{article.title}</h3>
      {article.excerpt ? <p className="text-sm leading-relaxed text-fg-muted line-clamp-3">{article.excerpt}</p> : null}
    </Link>
  );
}
