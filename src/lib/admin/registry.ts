import { destination, partner, pathway, programme, university } from "./entities/catalogue";
import { document, event, faq, newsArticle, page } from "./entities/editorial";
import { facility, faculty, outcomeMetric, studentStory } from "./entities/people";
import type { ChildDef, EntityDef } from "./types";

/** Ordered list — this order is used by the sidebar and the dashboard. */
export const ENTITIES: EntityDef[] = [page, programme, pathway, destination, university, partner, studentStory, faculty, facility, outcomeMetric, newsArticle, event, faq, document];

const byKey = new Map(ENTITIES.map((e) => [e.key, e]));

/** Resolve a URL segment to its entity definition, or null when unknown. */
export function getEntity(key: string | undefined): EntityDef | null {
  if (!key) return null;
  return byKey.get(key) ?? null;
}

export function getChild(def: EntityDef, childKey: string): ChildDef | null {
  return def.children?.find((c) => c.key === childKey) ?? null;
}

export function entityHref(def: EntityDef, id?: string) {
  return id ? `/admin/${def.key}/${id}` : `/admin/${def.key}`;
}

export function recordTitle(def: EntityDef, record: Record<string, unknown>) {
  const v = record[def.titleField];
  return typeof v === "string" && v.trim() ? v : "(untitled)";
}
