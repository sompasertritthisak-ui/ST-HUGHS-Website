import type { EntityType } from "@/lib/enums";

/**
 * Registry types for the generic CMS. An `EntityDef` describes an editable
 * Prisma model: how it is listed, which fields its form has, how those fields
 * are validated and which public routes to revalidate after a change.
 */

export type FieldType =
  | "text"
  | "slug"
  | "url"
  | "textarea"
  | "markdown"
  | "json"
  | "number"
  | "boolean"
  | "select"
  | "date"
  | "string-array"
  | "relation"
  | "media";

export type FieldGroup = "main" | "details" | "governance" | "seo";

export type DelegateName =
  | "page"
  | "contentBlock"
  | "programme"
  | "programmeModule"
  | "pathway"
  | "pathwayStep"
  | "destination"
  | "university"
  | "partner"
  | "studentStory"
  | "faculty"
  | "facility"
  | "outcomeMetric"
  | "newsArticle"
  | "event"
  | "faq"
  | "document"
  | "media"
  | "user";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  /** Empty value is rejected. */
  required?: boolean;
  /** Column is NOT NULL: an empty optional value is stored as "" rather than null. */
  nonNull?: boolean;
  hint?: string;
  group?: FieldGroup;
  /** select */
  options?: readonly string[];
  optionLabels?: Record<string, string>;
  /** relation */
  relation?: { delegate: DelegateName; labelField: string };
  /** media picker: restrict to these Media.kind values */
  mediaKinds?: readonly string[];
  /** number */
  integer?: boolean;
  min?: number;
  max?: number;
  /** text length cap (default 2000 for text, 20000 for long text) */
  maxLength?: number;
  fullWidth?: boolean;
}

export type AdminRecord = Record<string, unknown> & { id: string };

export type ColumnKind = "text" | "mono" | "status" | "verification" | "date" | "boolean" | "number";

export interface ListColumn {
  key: string;
  label: string;
  kind?: ColumnKind;
}

export interface ChildDef {
  key: string;
  label: string;
  labelSingular: string;
  delegate: DelegateName;
  parentField: string;
  titleField: string;
  fields: FieldDef[];
}

export interface EntityDef {
  /** URL segment, e.g. `programmes`. */
  key: string;
  type: EntityType;
  delegate: DelegateName;
  label: string;
  labelSingular: string;
  description: string;
  titleField: string;
  searchFields: string[];
  listColumns: ListColumn[];
  sortable: string[];
  defaultSort: { field: string; dir: "asc" | "desc" };
  fields: FieldDef[];
  hasStatus: boolean;
  hasPublishAt?: boolean;
  hasBlocks?: boolean;
  children?: ChildDef[];
  /** Public routes affected by this record (for revalidatePath). */
  publicPaths: (record: AdminRecord) => string[];
  /** Return an error message to block a workflow transition, or null to allow it. */
  guardStatus?: (record: AdminRecord, to: string) => string | null;
  /** Return an error message to block a save, or null to allow it. */
  guardSave?: (values: Record<string, unknown>, existing: AdminRecord | null) => string | null;
}

export interface ActionState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  id?: string;
}

export const idle: ActionState = { ok: false };
