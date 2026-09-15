import "server-only";
import { prisma } from "@/lib/prisma";
import { CONTENT_STATUSES } from "@/lib/enums";
import { delegate } from "./delegate";
import type { AdminRecord, EntityDef, FieldDef } from "./types";

export const PAGE_SIZE = 25;

export interface ListParams {
  q?: string;
  status?: string;
  sort?: string;
  dir?: string;
  page?: string;
}

export async function listEntity(def: EntityDef, params: ListParams) {
  const q = (params.q ?? "").trim().slice(0, 100);
  const status = CONTENT_STATUSES.includes(params.status as (typeof CONTENT_STATUSES)[number]) ? params.status : undefined;
  const sort = def.sortable.includes(params.sort ?? "") ? (params.sort as string) : def.defaultSort.field;
  const dir = params.dir === "asc" || params.dir === "desc" ? params.dir : def.defaultSort.dir;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Record<string, unknown> = {};
  if (q) where.OR = def.searchFields.map((field) => ({ [field]: { contains: q } }));
  if (status && def.hasStatus) where.status = status;

  const d = delegate(def.delegate);
  const [total, rows] = await Promise.all([
    d.count({ where }),
    d.findMany({ where, orderBy: [{ [sort]: dir }, { id: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), q, status: status ?? "", sort, dir };
}

/** Load the record with its inline children / blocks for the edit page. */
export function getRecord(def: EntityDef, id: string) {
  const include: Record<string, unknown> = {};
  for (const child of def.children ?? []) include[child.key] = { orderBy: { order: "asc" } };
  if (def.hasBlocks) include.blocks = { orderBy: { order: "asc" } };
  return delegate(def.delegate).findUnique({ where: { id }, ...(Object.keys(include).length ? { include } : {}) });
}

export type RelationOption = { id: string; label: string };
export type RelationOptions = Record<string, RelationOption[]>;

export async function loadRelationOptions(fields: FieldDef[]): Promise<RelationOptions> {
  const out: RelationOptions = {};
  await Promise.all(
    fields
      .filter((f) => f.type === "relation" && f.relation)
      .map(async (f) => {
        const rel = f.relation!;
        const where = rel.delegate === "user" ? { isActive: true } : {};
        const rows = await delegate(rel.delegate).findMany({ where, select: { id: true, [rel.labelField]: true }, orderBy: { [rel.labelField]: "asc" }, take: 500 });
        out[f.name] = rows.map((r) => ({ id: r.id, label: String(r[rel.labelField] ?? r.id) }));
      }),
  );
  return out;
}

export type MediaPreview = { id: string; url: string; alt: string; kind: string; filename: string };
export type MediaPreviews = Record<string, MediaPreview>;

/** Current media values for media fields (so the picker can render a thumbnail). */
export async function loadMediaPreviews(fields: FieldDef[], record: Record<string, unknown> | null): Promise<MediaPreviews> {
  if (!record) return {};
  const ids = fields.filter((f) => f.type === "media").map((f) => record[f.name]).filter((v): v is string => typeof v === "string" && v.length > 0);
  if (ids.length === 0) return {};
  const rows = await prisma.media.findMany({ where: { id: { in: ids } }, select: { id: true, url: true, alt: true, kind: true, filename: true } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: MediaPreviews = {};
  for (const f of fields) {
    const v = record[f.name];
    if (f.type === "media" && typeof v === "string" && byId.has(v)) out[f.name] = byId.get(v)!;
  }
  return out;
}

export async function ownerName(record: AdminRecord | null) {
  const ownerId = record?.ownerId;
  if (typeof ownerId !== "string") return null;
  const u = await prisma.user.findUnique({ where: { id: ownerId }, select: { name: true } });
  return u?.name ?? null;
}
