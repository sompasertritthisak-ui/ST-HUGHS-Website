import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugifyLib from "slugify";
import type { z } from "zod";

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

/** Parse a JSON string column into a string array without pulling a validator into client bundles. */
export function parseStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) && value.every((v) => typeof v === "string") ? (value as string[]) : [];
  } catch {
    return [];
  }
}

/** All human-readable dates and times on the site and in the CMS are shown in campus time (Laos, UTC+7, no DST),
 *  regardless of the server's clock (Railway and Cloudflare run in UTC). */
export const CAMPUS_TIME_ZONE = "Asia/Vientiane";
const CAMPUS_UTC_OFFSET = "+07:00";

export function formatDate(date: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: CAMPUS_TIME_ZONE, ...opts }).format(d);
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
    timeZone: CAMPUS_TIME_ZONE,
  }).format(d);
}

/** Date → the `YYYY-MM-DDTHH:mm` value a `<input type="datetime-local">` expects, expressed in campus time. */
export function toCampusLocalInput(d: Date): string {
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAMPUS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((x) => x.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Parse a date string typed in the CMS. Zone-less values (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm[:ss]`) are read as campus
 *  time; anything carrying its own zone or offset is parsed as-is. Returns an invalid Date for unparseable input. */
export function fromCampusLocalInput(s: string): Date {
  const v = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00${CAMPUS_UTC_OFFSET}`);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(v)) return new Date(`${v}${v.length === 16 ? ":00" : ""}${CAMPUS_UTC_OFFSET}`);
  return new Date(v);
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
