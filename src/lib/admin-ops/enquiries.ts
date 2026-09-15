import "server-only";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AudienceSchema, EnquiryStatusSchema, EnquiryTypeSchema } from "@/lib/enums";
import { sp, spInt } from "./form";

export const ENQUIRY_PAGE_SIZE = 25;

const SORT_FIELDS = ["createdAt", "updatedAt", "name", "status", "followUpAt"] as const;
export type EnquirySortField = (typeof SORT_FIELDS)[number];

/**
 * Filters shared by the list view, the board view and the CSV export so all
 * three always agree on "which enquiries". Parsed from URL searchParams and
 * validated with Zod — anything invalid is simply dropped.
 */
export const EnquiryFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: EnquiryStatusSchema.optional(),
  type: EnquiryTypeSchema.optional(),
  audience: AudienceSchema.optional(),
  programmeId: z.string().max(64).optional(),
  destinationId: z.string().max(64).optional(),
  /** a User id, or the literal "unassigned" */
  assignedToId: z.string().max(64).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  sort: z.enum(SORT_FIELDS).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).default(1),
});
export type EnquiryFilters = z.infer<typeof EnquiryFiltersSchema>;

type SP = Record<string, string | string[] | undefined>;

export function parseEnquiryFilters(params: SP): EnquiryFilters {
  const raw = {
    q: sp(params, "q"),
    status: sp(params, "status"),
    type: sp(params, "type"),
    audience: sp(params, "audience"),
    programmeId: sp(params, "programmeId"),
    destinationId: sp(params, "destinationId"),
    assignedToId: sp(params, "assignedToId"),
    from: sp(params, "from"),
    to: sp(params, "to"),
    utmCampaign: sp(params, "utmCampaign"),
    sort: sp(params, "sort"),
    dir: sp(params, "dir"),
    page: spInt(params, "page", 1),
  };
  // Validate field-by-field so one bad value does not discard the rest.
  const shape = EnquiryFiltersSchema.shape;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    const r = shape[key].safeParse(raw[key]);
    if (r.success) out[key] = r.data;
  }
  return EnquiryFiltersSchema.parse(out);
}

/** The filters as a flat record — handy for building links and hidden inputs. */
export function filtersToParams(f: EnquiryFilters): Record<string, string | undefined> {
  return {
    q: f.q,
    status: f.status,
    type: f.type,
    audience: f.audience,
    programmeId: f.programmeId,
    destinationId: f.destinationId,
    assignedToId: f.assignedToId,
    from: f.from,
    to: f.to,
    utmCampaign: f.utmCampaign,
    sort: f.sort !== "createdAt" ? f.sort : undefined,
    dir: f.dir !== "desc" ? f.dir : undefined,
  };
}

export function buildEnquiryWhere(f: EnquiryFilters, opts: { ignoreStatus?: boolean } = {}): Prisma.EnquiryWhereInput {
  const where: Prisma.EnquiryWhereInput = {};
  if (f.status && !opts.ignoreStatus) where.status = f.status;
  if (f.type) where.type = f.type;
  if (f.audience) where.audience = f.audience;
  if (f.programmeId) where.programmeId = f.programmeId;
  if (f.destinationId) where.destinationId = f.destinationId;
  if (f.assignedToId) where.assignedToId = f.assignedToId === "unassigned" ? null : f.assignedToId;
  if (f.utmCampaign) where.utmCampaign = f.utmCampaign;
  if (f.from || f.to) {
    where.createdAt = {
      ...(f.from ? { gte: new Date(`${f.from}T00:00:00`) } : {}),
      ...(f.to ? { lte: new Date(`${f.to}T23:59:59.999`) } : {}),
    };
  }
  if (f.q) {
    where.OR = [{ name: { contains: f.q } }, { email: { contains: f.q } }];
  }
  return where;
}

const listInclude = {
  programme: { select: { id: true, title: true, slug: true } },
  destination: { select: { id: true, country: true, slug: true } },
  assignedTo: { select: { id: true, name: true } },
  campaign: { select: { id: true, name: true } },
  consultation: { select: { preferredDate: true, mode: true, confirmedAt: true } },
} satisfies Prisma.EnquiryInclude;

export type EnquiryListRow = Prisma.EnquiryGetPayload<{ include: typeof listInclude }>;

export async function listEnquiries(f: EnquiryFilters) {
  const where = buildEnquiryWhere(f);
  const orderBy: Prisma.EnquiryOrderByWithRelationInput[] =
    f.sort === "followUpAt" ? [{ followUpAt: { sort: f.dir, nulls: "last" } }, { createdAt: "desc" }] : [{ [f.sort]: f.dir }, { createdAt: "desc" }];
  const [rows, total] = await Promise.all([
    prisma.enquiry.findMany({ where, include: listInclude, orderBy, skip: (f.page - 1) * ENQUIRY_PAGE_SIZE, take: ENQUIRY_PAGE_SIZE }),
    prisma.enquiry.count({ where }),
  ]);
  return { rows, total, page: f.page, pageSize: ENQUIRY_PAGE_SIZE };
}

/** Board: every status column, capped per column so the page stays light. */
export async function boardEnquiries(f: EnquiryFilters, perColumn = 60) {
  const where = buildEnquiryWhere(f, { ignoreStatus: true });
  const rows = await prisma.enquiry.findMany({
    where,
    include: listInclude,
    orderBy: [{ followUpAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: perColumn * 9,
  });
  const counts = await prisma.enquiry.groupBy({ by: ["status"], where, _count: { _all: true } });
  const byStatus = new Map<string, EnquiryListRow[]>();
  for (const r of rows) {
    const col = byStatus.get(r.status) ?? [];
    if (col.length < perColumn) col.push(r);
    byStatus.set(r.status, col);
  }
  const countMap = new Map(counts.map((c) => [c.status, c._count._all]));
  return { byStatus, countMap };
}

export async function getEnquiryDetail(id: string) {
  return prisma.enquiry.findUnique({
    where: { id },
    include: {
      programme: { select: { id: true, title: true, slug: true } },
      destination: { select: { id: true, country: true, slug: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      campaign: { select: { id: true, name: true, utmCampaign: true } },
      consultation: true,
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type EnquiryDetail = NonNullable<Awaited<ReturnType<typeof getEnquiryDetail>>>;

/** Note authors are stored by id only (no relation) — resolve names in one query. */
export async function resolveAuthors(ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  if (!unique.length) return new Map<string, string>();
  const users = await prisma.user.findMany({ where: { id: { in: unique } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name]));
}

export const ASSIGNABLE_ROLES = ["ADMISSIONS", "SUPER_ADMIN", "CONTENT_ADMIN"] as const;

export function listAssignableUsers() {
  return prisma.user.findMany({
    where: { isActive: true, role: { in: [...ASSIGNABLE_ROLES] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

export function listProgrammeOptions() {
  return prisma.programme.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } });
}

export function listDestinationOptions() {
  return prisma.destination.findMany({ select: { id: true, country: true }, orderBy: { country: "asc" } });
}

export async function listUtmCampaignOptions() {
  const rows = await prisma.enquiry.groupBy({ by: ["utmCampaign"], where: { utmCampaign: { not: null } }, _count: { _all: true }, orderBy: { _count: { utmCampaign: "desc" } }, take: 50 });
  return rows.map((r) => r.utmCampaign).filter((v): v is string => Boolean(v));
}

/** Rows for CSV export — same filters, no pagination, capped defensively. */
export function exportEnquiries(f: EnquiryFilters, includeNotes: boolean, cap = 10_000) {
  return prisma.enquiry.findMany({
    where: buildEnquiryWhere(f),
    include: { ...listInclude, consultation: true, notes: includeNotes ? { orderBy: { createdAt: "asc" } } : false },
    orderBy: { createdAt: "desc" },
    take: cap,
  });
}
