import { z } from "zod";
import type { FieldDef } from "./types";

/**
 * Builds a Zod schema from registry field definitions and parses FormData
 * against it. Parsed values are in "domain" form (Date, number, string[]);
 * `serialize()` turns them into Prisma-writable values (JSON strings).
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_RE = /^[a-z0-9_-]{5,64}$/i;

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

function stringField(field: FieldDef): z.ZodType<unknown> {
  const long = field.type === "textarea" || field.type === "markdown" || field.type === "json";
  let s = z.string({ error: "Enter text" }).trim().max(field.maxLength ?? (long ? 50_000 : 500), { error: "Too long" });
  if (field.type === "slug") s = s.regex(SLUG_RE, { error: "Use lowercase letters, numbers and hyphens" }).or(z.literal("")) as unknown as typeof s;
  if (field.type === "url") s = s.regex(/^(https?:\/\/\S+|\/\S*)$/, { error: "Enter a full URL (https://…) or a site path (/…)" }).or(z.literal("")) as unknown as typeof s;
  if (field.type === "json") {
    s = s.refine(
      (v) => {
        if (v === "") return true;
        try {
          JSON.parse(v);
          return true;
        } catch {
          return false;
        }
      },
      { error: "Must be valid JSON" },
    ) as unknown as typeof s;
  }
  if (field.required) return s.min(1, { error: "Required" });
  return s.transform((v) => (v === "" ? (field.nonNull ? "" : null) : v));
}

function numberField(field: FieldDef): z.ZodType<unknown> {
  let n = z.number({ error: "Must be a number" });
  if (field.integer) n = n.int({ error: "Must be a whole number" });
  if (field.min !== undefined) n = n.min(field.min, { error: `Minimum ${field.min}` });
  if (field.max !== undefined) n = n.max(field.max, { error: `Maximum ${field.max}` });
  const inner = field.required || field.nonNull ? n : n.nullable();
  return z.preprocess((v) => {
    const s = emptyToNull(v);
    if (s === null) return field.nonNull && !field.required ? 0 : null;
    return typeof s === "string" ? Number(s) : s;
  }, inner);
}

function dateField(field: FieldDef): z.ZodType<unknown> {
  const d = z.date({ error: "Enter a valid date" });
  return z.preprocess((v) => {
    const s = emptyToNull(v);
    if (s === null) return null;
    const parsed = typeof s === "string" ? new Date(s) : s;
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : "invalid";
  }, field.required ? d : d.nullable());
}

export function fieldSchema(field: FieldDef): z.ZodType<unknown> {
  switch (field.type) {
    case "text":
    case "slug":
    case "url":
    case "textarea":
    case "markdown":
    case "json":
      return stringField(field);
    case "number":
      return numberField(field);
    case "boolean":
      return z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean());
    case "select": {
      const opts = field.options ?? [];
      if (opts.length === 0) return z.string();
      return z.enum(opts as [string, ...string[]], { error: "Choose an option" });
    }
    case "date":
      return dateField(field);
    case "string-array":
      return z.preprocess(
        (v) =>
          typeof v === "string"
            ? v
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean)
            : Array.isArray(v)
              ? v
              : [],
        z.array(z.string().max(300)).max(200),
      );
    case "relation":
    case "media": {
      const id = z.string().regex(ID_RE, { error: "Invalid reference" });
      return z.preprocess(emptyToNull, field.required ? id : id.nullable());
    }
  }
}

export function buildSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodType<unknown>> = {};
  for (const field of fields) shape[field.name] = fieldSchema(field);
  return z.object(shape);
}

export type ParseResult = { ok: true; data: Record<string, unknown> } | { ok: false; errors: Record<string, string> };

/** Read only the declared fields out of FormData and validate them. */
export function parseFormData(fields: FieldDef[], formData: FormData): ParseResult {
  const raw: Record<string, unknown> = {};
  for (const field of fields) {
    const v = formData.get(field.name);
    raw[field.name] = typeof v === "string" ? v : field.type === "boolean" ? "false" : "";
  }
  const result = buildSchema(fields).safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/** Domain values → Prisma-writable values. */
export function serialize(fields: FieldDef[], data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const v = data[field.name];
    out[field.name] = field.type === "string-array" ? JSON.stringify(Array.isArray(v) ? v : []) : v;
  }
  return out;
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type FormValues = Record<string, string | boolean>;

/** Prisma record → values a form can render (strings/booleans). */
export function toFormValues(fields: FieldDef[], record: Record<string, unknown> | null): FormValues {
  const out: FormValues = {};
  for (const field of fields) {
    const v = record?.[field.name];
    switch (field.type) {
      case "boolean":
        out[field.name] = v === true;
        break;
      case "date":
        out[field.name] = v instanceof Date ? toLocalInput(v) : typeof v === "string" && v ? toLocalInput(new Date(v)) : "";
        break;
      case "string-array": {
        let arr: unknown = [];
        try {
          arr = typeof v === "string" ? JSON.parse(v) : Array.isArray(v) ? v : [];
        } catch {
          arr = [];
        }
        out[field.name] = Array.isArray(arr) ? arr.map(String).join("\n") : "";
        break;
      }
      case "select":
        out[field.name] = typeof v === "string" && v ? v : (field.options?.[0] ?? "");
        break;
      default:
        out[field.name] = v === null || v === undefined ? "" : String(v);
    }
  }
  return out;
}
