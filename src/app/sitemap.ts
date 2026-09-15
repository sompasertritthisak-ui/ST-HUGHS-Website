import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/content-pages";
import { absolute } from "@/lib/seo";

const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/why-st-hughs", priority: 0.7, changeFrequency: "monthly" },
  { path: "/programmes", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pathways", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pathway-explorer", priority: 0.8, changeFrequency: "weekly" },
  { path: "/compare", priority: 0.6, changeFrequency: "monthly" },
  { path: "/pathway-finder", priority: 0.7, changeFrequency: "monthly" },
  { path: "/universities", priority: 0.8, changeFrequency: "weekly" },
  { path: "/destinations", priority: 0.8, changeFrequency: "weekly" },
  { path: "/student-life", priority: 0.6, changeFrequency: "monthly" },
  { path: "/campus", priority: 0.6, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.6, changeFrequency: "monthly" },
  { path: "/admissions", priority: 0.9, changeFrequency: "monthly" },
  { path: "/international-students", priority: 0.7, changeFrequency: "monthly" },
  { path: "/news", priority: 0.6, changeFrequency: "weekly" },
  { path: "/resources", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faqs", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
  { path: "/consultation", priority: 0.9, changeFrequency: "yearly" },
  { path: "/enquire", priority: 0.8, changeFrequency: "yearly" },
  { path: "/student-stories", priority: 0.6, changeFrequency: "weekly" },
  { path: "/for/students", priority: 0.7, changeFrequency: "monthly" },
  { path: "/for/parents", priority: 0.7, changeFrequency: "monthly" },
  { path: "/for/partners", priority: 0.5, changeFrequency: "monthly" },
  { path: "/for/employers", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();
  const dynamic = (prefix: string, rows: { slug: string; updatedAt: Date }[], priority: number): MetadataRoute.Sitemap =>
    rows.map((r) => ({ url: absolute(`${prefix}/${r.slug}`), lastModified: r.updatedAt, changeFrequency: "monthly", priority }));
  return [
    ...STATIC.map((s) => ({ url: absolute(s.path), lastModified: new Date(), changeFrequency: s.changeFrequency, priority: s.priority })),
    ...dynamic("/programmes", entries.programmes, 0.8),
    ...dynamic("/pathways", entries.pathways, 0.8),
    ...dynamic("/universities", entries.universities, 0.6),
    ...dynamic("/destinations", entries.destinations, 0.6),
    ...dynamic("/news", entries.news, 0.5),
    ...dynamic("/student-stories", entries.stories, 0.5),
    ...dynamic("", entries.pages, 0.3),
  ];
}
