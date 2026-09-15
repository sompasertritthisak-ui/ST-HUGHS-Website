import type { Metadata } from "next";
import type { ContactSettings } from "./content";

/**
 * SEO helpers: canonical metadata and JSON-LD builders.
 * Pure functions — safe to import from server components and route files.
 */

export const SITE_NAME = "St Hugh's College Vientiane";

export function siteUrl() {
  return (process.env.APPLICATION_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absolute(path = "/") {
  return new URL(path, siteUrl() + "/").toString();
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  type = "website",
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
}): Metadata {
  const url = absolute(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      locale: "en_GB",
      ...(image ? { images: [{ url: image }] } : {}),
      ...(type === "article"
        ? { publishedTime: publishedTime?.toISOString(), modifiedTime: modifiedTime?.toISOString() }
        : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── JSON-LD builders ──────────────────────────────────────────────────────────

export type JsonLdObject = Record<string, unknown>;

export function educationalOrganizationJsonLd(
  contact: ContactSettings,
  extra: { established?: number | null; description?: string | null } = {},
): JsonLdObject {
  const sameAs = Object.values(contact.social ?? {}).filter((v): v is string => Boolean(v));
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: contact.institutionName || SITE_NAME,
    alternateName: contact.shortName || undefined,
    url: siteUrl(),
    ...(extra.description ? { description: extra.description } : {}),
    ...(extra.established ? { foundingDate: String(extra.established) } : {}),
    ...(contact.addressLines.length
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: contact.addressLines[0],
            addressLocality: contact.addressLines.slice(1, -1).join(", ") || undefined,
            addressCountry: "LA",
          },
        }
      : {}),
    ...(contact.phones[0] ? { telephone: contact.phones[0] } : {}),
    ...(contact.emails[0] ? { email: contact.emails[0] } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function courseJsonLd(p: {
  slug: string;
  title: string;
  summary: string;
  code?: string | null;
  level?: string | null;
  awardingBody?: string | null;
  durationMonths?: number | null;
  studyLocation?: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: p.title,
    description: p.summary,
    url: absolute(`/programmes/${p.slug}`),
    ...(p.code ? { courseCode: p.code } : {}),
    ...(p.level ? { educationalLevel: p.level } : {}),
    ...(p.durationMonths ? { timeRequired: `P${p.durationMonths}M` } : {}),
    inLanguage: "en",
    provider: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      url: siteUrl(),
    },
    ...(p.awardingBody
      ? { educationalCredentialAwarded: { "@type": "EducationalOccupationalCredential", name: `${p.awardingBody} ${p.title}`, recognizedBy: { "@type": "Organization", name: p.awardingBody } } }
      : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "onsite",
      location: { "@type": "Place", name: p.studyLocation ?? SITE_NAME },
    },
  };
}

export function articleJsonLd(a: {
  slug: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  authorName?: string | null;
  image?: string | null;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    ...(a.excerpt ? { description: a.excerpt } : {}),
    url: absolute(`/news/${a.slug}`),
    mainEntityOfPage: absolute(`/news/${a.slug}`),
    ...(a.publishedAt ? { datePublished: a.publishedAt.toISOString() } : {}),
    ...(a.updatedAt ? { dateModified: a.updatedAt.toISOString() } : {}),
    ...(a.image ? { image: [absolute(a.image)] } : {}),
    author: { "@type": a.authorName ? "Person" : "Organization", name: a.authorName || SITE_NAME },
    publisher: { "@type": "EducationalOrganization", name: SITE_NAME, url: siteUrl() },
  };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbListJsonLd(items: { label: string; href: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: absolute(item.href),
    })),
  };
}

/** Serialise for a <script type="application/ld+json"> without breaking out of the tag. */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
