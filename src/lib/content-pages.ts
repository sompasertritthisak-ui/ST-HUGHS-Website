import "server-only";
import { z } from "zod";
import { prisma } from "./prisma";
import { getSetting } from "./content";

/**
 * Additional PUBLISHED-only queries used by the public content pages.
 * Kept separate from `content.ts` (owned by the core layer).
 */

const PUBLISHED = { status: "PUBLISHED" } as const;
const now = () => new Date();
const scheduled = () => ({ status: "PUBLISHED", OR: [{ publishAt: null }, { publishAt: { lte: now() } }] });

// ── Institution settings (corporate credibility layer) ──────────────────────

export const InstitutionSettingsSchema = z.object({
  established: z.number().int().optional(),
  authorisation: z.string().optional().default(""),
  authorisationSource: z.string().optional().default(""),
  ncukStudyCentre: z.boolean().optional().default(false),
  ncukSince: z.string().optional().default(""),
  sisterInstitution: z.string().optional().default(""),
  vision: z.string().optional().default(""),
  mission: z.string().optional().default(""),
  history: z.string().optional().default(""),
  governanceNote: z.string().optional().default(""),
  academicModel: z.string().optional().default(""),
  futureDirection: z.string().optional().default(""),
  safeguardingNote: z.string().optional().default(""),
  // International students — all optional, rendered as "Confirmed by the admissions team" when empty.
  visaOfficialLink: z.string().optional().default(""),
  visaNote: z.string().optional().default(""),
  accommodation: z.string().optional().default(""),
  studentSupport: z.string().optional().default(""),
  livingInLaos: z.string().optional().default(""),
  costs: z.string().optional().default(""),
  // Careers & employability — published as confirmed.
  internships: z.string().optional().default(""),
  employerConnections: z.string().optional().default(""),
  industryExperience: z.string().optional().default(""),
  professionalSkills: z.string().optional().default(""),
  careerGuidance: z.string().optional().default(""),
  networking: z.string().optional().default(""),
  practicalLearning: z.string().optional().default(""),
});
export type InstitutionSettings = z.infer<typeof InstitutionSettingsSchema>;
export const getInstitutionSettings = () => getSetting("institution", InstitutionSettingsSchema);

// ── Catalogue helpers ───────────────────────────────────────────────────────

export function getPathwaysForUniversity(universitySlug: string) {
  return prisma.pathway.findMany({
    where: { ...PUBLISHED, university: { slug: universitySlug } },
    include: {
      programme: { select: { slug: true, title: true, shortTitle: true, type: true } },
      destination: true,
      university: true,
      steps: { orderBy: { order: "asc" } },
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
}

export async function getPathwaySubjectAreas(): Promise<string[]> {
  const rows = await prisma.pathway.findMany({ where: { ...PUBLISHED, subjectArea: { not: null } }, select: { subjectArea: true }, distinct: ["subjectArea"], orderBy: { subjectArea: "asc" } });
  return rows.map((r) => r.subjectArea).filter((s): s is string => Boolean(s));
}

export async function getNewsCategoriesInUse(): Promise<string[]> {
  const rows = await prisma.newsArticle.findMany({ where: { ...scheduled(), visibility: "PUBLIC" }, select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } });
  return rows.map((r) => r.category);
}

export function getApprovedMedia(ids: string[]) {
  if (ids.length === 0) return Promise.resolve([]);
  return prisma.media.findMany({ where: { id: { in: ids }, usageStatus: "APPROVED" } });
}

export function getStoriesForPathway(pathwaySlug: string) {
  return prisma.studentStory.findMany({
    where: { status: "PUBLISHED", consentStatus: "GRANTED", pathway: { slug: pathwaySlug } },
    include: { photo: true, programme: { select: { slug: true, title: true, shortTitle: true } }, destination: true, university: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function getStoriesForDestination(destinationSlug: string) {
  return prisma.studentStory.findMany({
    where: { status: "PUBLISHED", consentStatus: "GRANTED", destination: { slug: destinationSlug } },
    include: { photo: true, programme: { select: { slug: true, title: true, shortTitle: true } }, destination: true, university: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function getRelatedNews(opts: { programmeSlug?: string; universitySlug?: string; take?: number }) {
  return prisma.newsArticle.findMany({
    where: {
      ...scheduled(),
      visibility: "PUBLIC",
      OR: [
        ...(opts.programmeSlug ? [{ relatedProgramme: { slug: opts.programmeSlug } }] : []),
        ...(opts.universitySlug ? [{ relatedUniversity: { slug: opts.universitySlug } }] : []),
      ],
    },
    include: { heroMedia: true },
    orderBy: [{ publishedAt: "desc" }],
    take: opts.take ?? 3,
  });
}

// ── Sitemap ─────────────────────────────────────────────────────────────────

export async function getSitemapEntries() {
  const [programmes, pathways, universities, destinations, news, stories, pages] = await Promise.all([
    prisma.programme.findMany({ where: scheduled(), select: { slug: true, updatedAt: true } }),
    prisma.pathway.findMany({ where: PUBLISHED, select: { slug: true, updatedAt: true } }),
    prisma.university.findMany({ where: PUBLISHED, select: { slug: true, updatedAt: true } }),
    prisma.destination.findMany({ where: PUBLISHED, select: { slug: true, updatedAt: true } }),
    prisma.newsArticle.findMany({ where: { ...scheduled(), visibility: "PUBLIC" }, select: { slug: true, updatedAt: true } }),
    prisma.studentStory.findMany({ where: { status: "PUBLISHED", consentStatus: "GRANTED" }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { ...scheduled(), noIndex: false }, select: { slug: true, updatedAt: true } }),
  ]);
  return { programmes, pathways, universities, destinations, news, stories, pages };
}
