import "server-only";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuditActionSchema } from "@/lib/enums";
import { sp, spInt } from "./form";

export const AUDIT_PAGE_SIZE = 50;

export const AuditFiltersSchema = z.object({
  actorId: z.string().max(64).optional(),
  action: AuditActionSchema.optional(),
  entityType: z.string().trim().max(64).optional(),
  entityId: z.string().trim().max(64).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  page: z.number().int().min(1).default(1),
});
export type AuditFilters = z.infer<typeof AuditFiltersSchema>;

type SP = Record<string, string | string[] | undefined>;

export function parseAuditFilters(params: SP): AuditFilters {
  const raw: Record<string, unknown> = {
    actorId: sp(params, "actorId"),
    action: sp(params, "action"),
    entityType: sp(params, "entityType"),
    entityId: sp(params, "entityId"),
    from: sp(params, "from"),
    to: sp(params, "to"),
    page: spInt(params, "page", 1),
  };
  const shape = AuditFiltersSchema.shape;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    const r = shape[key].safeParse(raw[key]);
    if (r.success) out[key] = r.data;
  }
  return AuditFiltersSchema.parse(out);
}

export function auditFiltersToParams(f: AuditFilters): Record<string, string | undefined> {
  return { actorId: f.actorId, action: f.action, entityType: f.entityType, entityId: f.entityId, from: f.from, to: f.to };
}

export async function listAuditLogs(f: AuditFilters) {
  const where: Prisma.AuditLogWhereInput = {};
  if (f.actorId) where.actorId = f.actorId === "system" ? null : f.actorId;
  if (f.action) where.action = f.action;
  if (f.entityType) where.entityType = f.entityType;
  if (f.entityId) where.entityId = f.entityId;
  if (f.from || f.to) {
    where.createdAt = {
      ...(f.from ? { gte: new Date(`${f.from}T00:00:00`) } : {}),
      ...(f.to ? { lte: new Date(`${f.to}T23:59:59.999`) } : {}),
    };
  }
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { rows, total, page: f.page, pageSize: AUDIT_PAGE_SIZE };
}

export type AuditRow = Awaited<ReturnType<typeof listAuditLogs>>["rows"][number];

export async function auditFilterOptions() {
  const [actors, entityTypes] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.auditLog.groupBy({ by: ["entityType"], orderBy: { entityType: "asc" } }),
  ]);
  return { actors, entityTypes: entityTypes.map((e) => e.entityType) };
}

/** Pretty JSON + the set of top-level keys whose value differs between before and after. */
export function diffJson(beforeJson: string | null, afterJson: string | null) {
  const parse = (raw: string | null): unknown => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };
  const before = parse(beforeJson);
  const after = parse(afterJson);
  const changed = new Set<string>();
  const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
  if (isObj(before) && isObj(after)) {
    for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) changed.add(k);
    }
  } else if (isObj(after) && before === null) {
    for (const k of Object.keys(after)) changed.add(k);
  } else if (isObj(before) && after === null) {
    for (const k of Object.keys(before)) changed.add(k);
  }
  return { before, after, changed };
}
