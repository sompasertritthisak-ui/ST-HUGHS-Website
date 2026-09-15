import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugifyLib from "slugify";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toSlug(input: string) {
  return slugifyLib(input, { lower: true, strict: true, trim: true });
}

/** Parse a JSON string column against a schema, falling back safely. */
export function parseJson<T>(raw: string | null | undefined, schema: z.ZodType<T>, fallback: T): T {
  if (!raw) return fallback;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export const StringArraySchema = z.array(z.string());

export function parseStringArray(raw: string | null | undefined): string[] {
  return parseJson(raw, StringArraySchema, []);
}

export function formatDate(date: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", ...opts }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function truncate(text: string, max = 160) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function absoluteUrl(path = "/") {
  const base = process.env.APPLICATION_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

/** Split a comma separated string into trimmed, non-empty items. */
export function splitList(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isPublished<T extends { status: string; publishAt?: Date | null }>(item: T, now = new Date()) {
  return item.status === "PUBLISHED" && (!item.publishAt || item.publishAt <= now);
}
