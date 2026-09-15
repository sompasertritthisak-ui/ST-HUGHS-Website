import "server-only";
import { prisma } from "@/lib/prisma";
import { CONTENT_STATUSES } from "@/lib/enums";
import { delegate } from "./delegate";
import { ENTITIES, recordTitle } from "./registry";
import type { EntityDef } from "./types";

export interface StatusCounts {
  def: EntityDef;
  counts: Record<string, number>;
  total: number;
}

export async function statusCountsByEntity(): Promise<StatusCounts[]> {
  return Promise.all(
    ENTITIES.map(async (def) => {
      const rows = await delegate(def.delegate).groupBy({ by: ["status"], _count: { _all: true } });
      const counts: Record<string, number> = Object.fromEntries(CONTENT_STATUSES.map((s) => [s, 0]));
      let total = 0;
      for (const r of rows) {
        counts[r.status ?? "DRAFT"] = r._count._all;
        total += r._count._all;
      }
      return { def, counts, total };
    }),
  );
}

export interface FlaggedItem {
  def: EntityDef;
  id: string;
  title: string;
  date: Date | null;
}

export async function awaitingApproval(limit = 20): Promise<FlaggedItem[]> {
  const lists = await Promise.all(
    ENTITIES.map(async (def) => {
      const rows = await delegate(def.delegate).findMany({ where: { status: "IN_REVIEW" }, orderBy: { updatedAt: "desc" }, take: limit });
      return rows.map((r) => ({ def, id: r.id, title: recordTitle(def, r), date: r.updatedAt instanceof Date ? r.updatedAt : null }));
    }),
  );
  return lists
    .flat()
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, limit);
}

export async function reviewOverdue(limit = 20): Promise<FlaggedItem[]> {
  const now = new Date();
  const withReview = ENTITIES.filter((def) => def.fields.some((f) => f.name === "reviewDate"));
  const lists = await Promise.all(
    withReview.map(async (def) => {
      const rows = await delegate(def.delegate).findMany({ where: { reviewDate: { lt: now }, status: { not: "ARCHIVED" } }, orderBy: { reviewDate: "asc" }, take: limit });
      return rows.map((r) => ({ def, id: r.id, title: recordTitle(def, r), date: r.reviewDate instanceof Date ? r.reviewDate : null }));
    }),
  );
  return lists
    .flat()
    .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0))
    .slice(0, limit);
}

export function recentAudit(take = 10) {
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take, include: { actor: { select: { name: true } } } });
}

export async function scheduledSoon(limit = 10): Promise<FlaggedItem[]> {
  const now = new Date();
  const lists = await Promise.all(
    ENTITIES.filter((d) => d.hasPublishAt).map(async (def) => {
      const rows = await delegate(def.delegate).findMany({ where: { status: "PUBLISHED", publishAt: { gt: now } }, orderBy: { publishAt: "asc" }, take: limit });
      return rows.map((r) => ({ def, id: r.id, title: recordTitle(def, r), date: r.publishAt instanceof Date ? r.publishAt : null }));
    }),
  );
  return lists.flat().sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0)).slice(0, limit);
}
