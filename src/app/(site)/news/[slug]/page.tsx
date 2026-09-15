import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsBySlug, getNews } from "@/lib/content";
import { pageMetadata, articleJsonLd } from "@/lib/seo";
import { formatDate, parseStringArray } from "@/lib/utils";
import { NEWS_CATEGORY_LABELS, type NewsCategory } from "@/lib/enums";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { NewsCard } from "@/components/cards/news-card";
import { Section, NextSteps } from "@/components/pages";
import { Markdown } from "@/components/ui/markdown";
import { Plate } from "@/components/ui/plate";
import { RouteLine } from "@/components/ui/route-line";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getNewsBySlug(slug);
  if (!a) return { title: "Article not found" };
  return pageMetadata({
    title: a.seoTitle ?? a.title,
    description: a.seoDescription ?? a.excerpt,
    path: `/news/${a.slug}`,
    type: "article",
    publishedTime: a.publishedAt,
    modifiedTime: a.updatedAt,
    image: a.heroMedia?.usageStatus === "APPROVED" ? a.heroMedia.url : null,
  });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) notFound();
  const more = (await getNews({ take: 4 })).filter((a) => a.id !== article.id).slice(0, 3);
  const tags = parseStringArray(article.tagsJson);
  const category = NEWS_CATEGORY_LABELS[article.category as NewsCategory] ?? article.category;
  const author = article.authorName ?? article.author?.name ?? null;
  const image = article.heroMedia?.usageStatus === "APPROVED" ? article.heroMedia : null;

  const related = [
    ...(article.relatedProgramme ? [{ label: article.relatedProgramme.shortTitle ?? article.relatedProgramme.title, description: "Related programme", href: `/programmes/${article.relatedProgramme.slug}` }] : []),
    ...(article.relatedUniversity ? [{ label: article.relatedUniversity.name, description: "Related university", href: `/universities/${article.relatedUniversity.slug}` }] : []),
    { label: "All news", description: "Announcements and insights", href: "/news" },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "News", href: "/news" }, { label: article.title, href: `/news/${article.slug}` }]} />
      <article>
        <header className="container-x pb-12 pt-16 md:pt-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <Eyebrow className="mb-6">
                {category}
                <span className="text-fg-subtle">· {formatDate(article.publishedAt)}</span>
              </Eyebrow>
              <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.98] text-fg text-balance">{article.title}</h1>
              {article.excerpt ? <p className="mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted text-pretty md:text-xl">{article.excerpt}</p> : null}
            </div>
            <dl className="grid grid-cols-2 gap-6 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em] lg:col-span-4">
              <div>
                <dt className="text-fg-subtle">Author</dt>
                <dd className="mt-2 normal-case tracking-normal text-fg">{author ?? "SHV Communications"}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Published</dt>
                <dd className="mt-2 normal-case tracking-normal text-fg">{formatDate(article.publishedAt) || "—"}</dd>
              </div>
            </dl>
          </div>
          <RouteLine className="mt-12" node="start" />
        </header>

        {image ? (
          <div className="container-x pb-12">
            <Plate media={image} slot="Article hero" aspect="21/9" sizes="(min-width:1320px) 1320px, 100vw" priority />
          </div>
        ) : null}

        <div className="container-x pb-16">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7 lg:col-start-3">
              <Markdown>{article.body}</Markdown>
              {tags.length ? (
                <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
                  {tags.map((t) => (
                    <li key={t}>
                      <Badge>{t}</Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      <Section eyebrow="Related" title="Connected to this article">
        <NextSteps items={related} />
      </Section>

      {more.length ? (
        <Section eyebrow="More" title="More news" layout="full">
          <div className="grid gap-8 md:grid-cols-3">
            {more.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </Section>
      ) : null}

      <JsonLd data={articleJsonLd({ ...article, authorName: author, image: image?.url ?? null })} />
      <ConsultationBand
        title={article.relatedProgramme ? `Interested in the ${article.relatedProgramme.shortTitle ?? article.relatedProgramme.title}?` : "Interested in what this means for you?"}
        body="See the related programme, or talk to an advisor about your own route."
        primaryHref={article.relatedProgramme ? `/programmes/${article.relatedProgramme.slug}` : "/programmes"}
        primaryLabel={article.relatedProgramme ? "View the programme" : "Explore programmes"}
        secondaryHref="/consultation"
        secondaryLabel="Talk to an advisor"
      />
    </>
  );
}
