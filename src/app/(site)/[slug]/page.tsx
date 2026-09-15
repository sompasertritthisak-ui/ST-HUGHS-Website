import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { BlockRenderer } from "@/components/blocks";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ConsultationBand } from "@/components/sections/consultation-band";

/**
 * Catch-all for CMS block pages (privacy, cookies, terms, accessibility and
 * any page an editor publishes). Static routes always take precedence.
 */
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Page not found" };
  const image = page.ogImage?.usageStatus === "APPROVED" ? page.ogImage.url : null;
  const meta = pageMetadata({ title: page.seoTitle ?? page.title, description: page.seoDescription ?? page.title, path: page.canonical ?? `/${page.slug}`, image, noIndex: page.noIndex });
  return { ...meta, openGraph: { ...meta.openGraph, title: page.ogTitle ?? page.seoTitle ?? page.title, description: page.ogDescription ?? page.seoDescription ?? page.title } };
}

export default async function BlockPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();
  const hasCta = page.blocks.some((b) => b.type === "CTA");
  return (
    <>
      <Breadcrumbs items={[{ label: page.title, href: `/${page.slug}` }]} />
      <BlockRenderer blocks={page.blocks} fallbackTitle={page.title} />
      {page.structuredDataJson ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: page.structuredDataJson.replace(/</g, "\\u003c") }} /> : null}
      {!hasCta ? <ConsultationBand title="Questions about this page?" body="Contact the college and we will answer directly." primaryHref="/contact" primaryLabel="Contact us" secondaryHref="/consultation" secondaryLabel="Book a consultation" /> : null}
    </>
  );
}
