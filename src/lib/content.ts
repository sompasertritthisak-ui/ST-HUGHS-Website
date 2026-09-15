import "server-only";
import { prisma } from "./prisma";
import { z } from "zod";
import { parseJson } from "./utils";

/**
 * Public content access layer. Everything here returns PUBLISHED content only
 * (respecting scheduled `publishAt`). Admin screens query Prisma directly.
 */

const now = () => new Date();

function publishedWhere() {
  return {
    status: "PUBLISHED",
    OR: [{ publishAt: null }, { publishAt: { lte: now() } }],
  };
}

const simplePublished = { status: "PUBLISHED" } as const;

// ── Navigation & settings ────────────────────────────────────────────────────

export async function getNavigation(menu: "HEADER" | "FOOTER" | "LEGAL" | "AUDIENCE") {
  const items = await prisma.navigationItem.findMany({
    where: { menu, isVisible: true, locale: "en" },
    orderBy: { order: "asc" },
  });
  const roots = items.filter((i) => !i.parentId);
  return roots.map((root) => ({
    ...root,
    children: items.filter((i) => i.parentId === root.id),
  }));
}

export type NavTree = Awaited<ReturnType<typeof getNavigation>>;

export const ContactSettingsSchema = z.object({
  institutionName: z.string().default("St Hugh's College Vientiane"),
  shortName: z.string().default("SHV"),
  addressLines: z.array(z.string()).default([]),
  phones: z.array(z.string()).default([]),
  emails: z.array(z.string()).default([]),
  whatsapp: z.string().optional().default(""),
  officeHours: z.array(z.string()).default([]),
  mapEmbedUrl: z.string().optional().default(""),
  mapLat: z.number().optional(),
  mapLng: z.number().optional(),
  social: z
    .object({
      facebook: z.string().optional(),
      linkedin: z.string().optional(),
      youtube: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
    })
    .default({}),
  admissionsContact: z.string().optional().default(""),
  pressContact: z.string().optional().default(""),
});
export type ContactSettings = z.infer<typeof ContactSettingsSchema>;

export const MessagingSettingsSchema = z.object({
  heroLine1: z.string().default("From Laos."),
  heroLine2: z.string().default("To the world."),
  heroSupport: z
    .string()
    .default(
      "International education, university pathways and future-focused programmes designed to help students take their next step with confidence.",
    ),
  tagline: z.string().default("Local start. Global future."),
  finalCtaTitle: z.string().default("Your next chapter starts here."),
  finalCtaBody: z
    .string()
    .default(
      "Whether you're planning your first step toward university, exploring an international pathway, or looking for a future beyond borders, St Hugh's College can help you understand the route ahead.",
    ),
  guidanceDisclaimer: z
    .string()
    .default("This is guidance to help you plan. It is not a formal admissions decision."),
  announcement: z.string().optional().default(""),
});
export type MessagingSettings = z.infer<typeof MessagingSettingsSchema>;

export async function getSetting<T>(key: string, schema: z.ZodType<T>): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  const fallback = schema.safeParse({});
  return parseJson(row?.valueJson, schema, fallback.success ? fallback.data : ({} as T));
}

export const getContactSettings = () => getSetting("contact", ContactSettingsSchema);
export const getMessagingSettings = () => getSetting("messaging", MessagingSettingsSchema);

// ── Catalogue ────────────────────────────────────────────────────────────────

export function getProgrammes(opts: { featured?: boolean; type?: string } = {}) {
  return prisma.programme.findMany({
    where: { ...publishedWhere(), ...(opts.featured ? { featured: true } : {}), ...(opts.type ? { type: opts.type } : {}) },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: { heroMedia: true },
  });
}

export function getProgrammeBySlug(slug: string) {
  return prisma.programme.findFirst({
    where: { slug, ...publishedWhere() },
    include: {
      heroMedia: true,
      modules: { orderBy: { order: "asc" } },
      pathways: {
        where: simplePublished,
        include: { destination: true, university: true, steps: { orderBy: { order: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      faqs: { where: simplePublished, orderBy: { sortOrder: "asc" } },
      stories: { where: { status: "PUBLISHED", consentStatus: "GRANTED" }, include: { photo: true } },
    },
  });
}

export function getPathways(opts: { featured?: boolean; programmeSlug?: string; destinationSlug?: string; subjectArea?: string } = {}) {
  return prisma.pathway.findMany({
    where: {
      status: "PUBLISHED",
      ...(opts.featured ? { featured: true } : {}),
      ...(opts.programmeSlug ? { programme: { slug: opts.programmeSlug } } : {}),
      ...(opts.destinationSlug ? { destination: { slug: opts.destinationSlug } } : {}),
      ...(opts.subjectArea ? { subjectArea: opts.subjectArea } : {}),
    },
    include: {
      programme: { select: { slug: true, title: true, shortTitle: true, type: true } },
      destination: true,
      university: true,
      steps: { orderBy: { order: "asc" } },
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
}

export type PathwayWithRelations = Awaited<ReturnType<typeof getPathways>>[number];

export function getPathwayBySlug(slug: string) {
  return prisma.pathway.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      programme: true,
      destination: true,
      university: true,
      steps: { orderBy: { order: "asc" } },
      stories: { where: { status: "PUBLISHED", consentStatus: "GRANTED" }, include: { photo: true } },
    },
  });
}

export function getDestinations() {
  return prisma.destination.findMany({
    where: simplePublished,
    orderBy: [{ sortOrder: "asc" }, { country: "asc" }],
    include: {
      heroMedia: true,
      universities: { where: simplePublished, orderBy: { sortOrder: "asc" } },
      pathways: { where: simplePublished, select: { id: true, slug: true, title: true, structureLabel: true, subjectArea: true } },
    },
  });
}

export type DestinationWithRelations = Awaited<ReturnType<typeof getDestinations>>[number];

export function getDestinationBySlug(slug: string) {
  return prisma.destination.findFirst({
    where: { slug, ...simplePublished },
    include: {
      heroMedia: true,
      universities: { where: simplePublished, include: { logo: true }, orderBy: { sortOrder: "asc" } },
      pathways: {
        where: simplePublished,
        include: { programme: { select: { slug: true, title: true, shortTitle: true } }, university: true, steps: { orderBy: { order: "asc" } } },
      },
    },
  });
}

export function getUniversities(opts: { featured?: boolean } = {}) {
  return prisma.university.findMany({
    where: { ...simplePublished, ...(opts.featured ? { featured: true } : {}) },
    include: { logo: true, destination: true, pathways: { where: simplePublished, select: { slug: true, title: true, structureLabel: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function getUniversityBySlug(slug: string) {
  return prisma.university.findFirst({
    where: { slug, ...simplePublished },
    include: {
      logo: true,
      destination: true,
      pathways: { where: simplePublished, include: { programme: { select: { slug: true, title: true } }, steps: { orderBy: { order: "asc" } } } },
    },
  });
}

export function getPartners() {
  return prisma.partner.findMany({ where: simplePublished, include: { logo: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

// ── People & proof ───────────────────────────────────────────────────────────

export function getStudentStories(opts: { featured?: boolean; take?: number } = {}) {
  return prisma.studentStory.findMany({
    where: { status: "PUBLISHED", consentStatus: "GRANTED", ...(opts.featured ? { featured: true } : {}) },
    include: { photo: true, programme: { select: { slug: true, title: true, shortTitle: true } }, destination: true, university: true },
    orderBy: { updatedAt: "desc" },
    take: opts.take,
  });
}

export function getStudentStoryBySlug(slug: string) {
  return prisma.studentStory.findFirst({
    where: { slug, status: "PUBLISHED", consentStatus: "GRANTED" },
    include: { photo: true, programme: true, pathway: true, destination: true, university: true },
  });
}

export function getFaculty(opts: { leadership?: boolean } = {}) {
  return prisma.faculty.findMany({
    where: { ...simplePublished, ...(opts.leadership ? { isLeadership: true } : {}) },
    include: { photo: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function getFacilities() {
  return prisma.facility.findMany({ where: simplePublished, include: { photo: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export function getOutcomeMetrics() {
  return prisma.outcomeMetric.findMany({ where: simplePublished, orderBy: { sortOrder: "asc" } });
}

// ── Editorial ────────────────────────────────────────────────────────────────

export function getNews(opts: { category?: string; take?: number } = {}) {
  return prisma.newsArticle.findMany({
    where: { ...publishedWhere(), visibility: "PUBLIC", ...(opts.category ? { category: opts.category } : {}) },
    include: { heroMedia: true, relatedProgramme: { select: { slug: true, title: true } }, relatedUniversity: { select: { slug: true, name: true } } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: opts.take,
  });
}

export function getNewsBySlug(slug: string) {
  return prisma.newsArticle.findFirst({
    where: { slug, ...publishedWhere(), visibility: "PUBLIC" },
    include: { heroMedia: true, relatedProgramme: true, relatedUniversity: true, author: { select: { name: true } } },
  });
}

export function getEvents(opts: { upcoming?: boolean } = {}) {
  return prisma.event.findMany({
    where: { ...simplePublished, ...(opts.upcoming ? { startsAt: { gte: now() } } : {}) },
    include: { heroMedia: true },
    orderBy: { startsAt: "asc" },
  });
}

export function getFaqs(opts: { category?: string; programmeSlug?: string } = {}) {
  return prisma.faq.findMany({
    where: { ...simplePublished, ...(opts.category ? { category: opts.category } : {}), ...(opts.programmeSlug ? { programme: { slug: opts.programmeSlug } } : {}) },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
}

export function getDocuments(opts: { category?: string } = {}) {
  return prisma.document.findMany({
    where: { ...simplePublished, visibility: "PUBLIC", ...(opts.category ? { category: opts.category } : {}) },
    include: { media: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
}

// ── Pages (block-based) ──────────────────────────────────────────────────────

export function getPageBySlug(slug: string) {
  return prisma.page.findFirst({
    where: { slug, ...publishedWhere() },
    include: { blocks: { where: { isVisible: true }, orderBy: { order: "asc" } }, ogImage: true },
  });
}

export function getPublishedPageSlugs() {
  return prisma.page.findMany({ where: publishedWhere(), select: { slug: true, updatedAt: true } });
}
