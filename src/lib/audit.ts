import "server-only";
import { prisma } from "./prisma";
import type { AuditAction, EntityType } from "./enums";

export async function recordAudit(input: {
  actorId?: string | null;
  action: AuditAction;
  entityType: EntityType | string;
  entityId?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        beforeJson: input.beforeJson ?? null,
        afterJson: input.afterJson ?? null,
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    console.error("audit.record failed", error);
  }
}

/** Snapshot an entity into the revision history and return the version number. */
export async function createRevision(input: {
  entityType: EntityType;
  entityId: string;
  snapshot: unknown;
  authorId?: string | null;
  note?: string | null;
}) {
  const last = await prisma.revision.findFirst({
    where: { entityType: input.entityType, entityId: input.entityId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (last?.version ?? 0) + 1;
  await prisma.revision.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      version,
      snapshotJson: JSON.stringify(input.snapshot),
      authorId: input.authorId ?? null,
      note: input.note ?? null,
    },
  });
  return version;
}

export function listRevisions(entityType: EntityType, entityId: string) {
  return prisma.revision.findMany({
    where: { entityType, entityId },
    orderBy: { version: "desc" },
    include: { author: { select: { name: true, email: true } } },
    take: 50,
  });
}

/** Strip relation/system fields so a snapshot can be written back with `update`. */
export function toWritableSnapshot<T extends Record<string, unknown>>(record: T, omit: string[] = []) {
  const blocked = new Set(["id", "createdAt", "updatedAt", ...omit]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (blocked.has(k)) continue;
    if (v !== null && typeof v === "object" && !(v instanceof Date)) continue; // relations
    out[k] = v;
  }
  return out;
}
