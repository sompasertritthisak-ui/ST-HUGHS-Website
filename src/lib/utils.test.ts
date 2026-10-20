// @vitest-environment node
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseJson, parseStringArray, splitList, toSlug, isPublished, truncate, cn, formatDate, formatDateTime, toCampusLocalInput, fromCampusLocalInput } from "./utils";

describe("parseJson", () => {
  const schema = z.object({ a: z.number() });
  it("parses valid JSON matching the schema", () => {
    expect(parseJson('{"a":1}', schema, { a: 0 })).toEqual({ a: 1 });
  });
  it("falls back on malformed JSON, schema mismatch, null and empty", () => {
    expect(parseJson("{oops", schema, { a: 9 })).toEqual({ a: 9 });
    expect(parseJson('{"a":"x"}', schema, { a: 9 })).toEqual({ a: 9 });
    expect(parseJson(null, schema, { a: 9 })).toEqual({ a: 9 });
    expect(parseJson("", schema, { a: 9 })).toEqual({ a: 9 });
  });
  it("parseStringArray returns [] for anything but a string array", () => {
    expect(parseStringArray('["a","b"]')).toEqual(["a", "b"]);
    expect(parseStringArray('[1,2]')).toEqual([]);
    expect(parseStringArray(undefined)).toEqual([]);
  });
});

describe("splitList", () => {
  it("splits, trims and drops empties", () => {
    expect(splitList(" a, b ,,c ")).toEqual(["a", "b", "c"]);
    expect(splitList("")).toEqual([]);
    expect(splitList(null)).toEqual([]);
  });
});

describe("toSlug", () => {
  it("lowercases, strips punctuation and trims", () => {
    expect(toSlug("NCUK International Foundation Year")).toBe("ncuk-international-foundation-year");
    expect(toSlug("  Bachelor (1+3) — UK!  ")).toBe("bachelor-13-uk");
  });
});

describe("isPublished", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  it("requires PUBLISHED status", () => {
    expect(isPublished({ status: "DRAFT" }, now)).toBe(false);
    expect(isPublished({ status: "PUBLISHED" }, now)).toBe(true);
  });
  it("respects scheduled publishAt", () => {
    expect(isPublished({ status: "PUBLISHED", publishAt: new Date("2026-07-01T00:00:00Z") }, now)).toBe(false);
    expect(isPublished({ status: "PUBLISHED", publishAt: new Date("2026-05-01T00:00:00Z") }, now)).toBe(true);
    expect(isPublished({ status: "PUBLISHED", publishAt: null }, now)).toBe(true);
  });
});

describe("misc", () => {
  it("truncate adds an ellipsis only when needed", () => {
    expect(truncate("short", 10)).toBe("short");
    expect(truncate("a".repeat(20), 10)).toHaveLength(10);
    expect(truncate("a".repeat(20), 10).endsWith("…")).toBe(true);
  });
  it("cn merges tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("campus time zone (Asia/Vientiane, UTC+7)", () => {
  // 03:16 UTC on the server clock is 10:16 in Vientiane — what the staff member sees on their own screen.
  const instant = new Date("2026-10-20T03:16:00Z");
  it("formatDateTime renders in campus time whatever the server zone", () => {
    expect(formatDateTime(instant)).toBe("20 Oct 2026, 10:16");
    expect(formatDateTime("2026-10-20T03:16:00Z")).toBe("20 Oct 2026, 10:16");
  });
  it("formatDate rolls the calendar day in campus time, and callers can still override options", () => {
    expect(formatDate(new Date("2026-03-01T20:30:00Z"))).toBe("2 March 2026");
    expect(formatDate(instant, { month: "short", hour: "2-digit", minute: "2-digit" })).toBe("20 Oct 2026, 10:16");
    expect(formatDate(null)).toBe("");
  });
  it("datetime-local round-trips through campus time", () => {
    expect(toCampusLocalInput(instant)).toBe("2026-10-20T10:16");
    expect(fromCampusLocalInput("2026-10-20T10:16").toISOString()).toBe("2026-10-20T03:16:00.000Z");
    expect(fromCampusLocalInput(toCampusLocalInput(instant)).getTime()).toBe(instant.getTime());
    expect(toCampusLocalInput(new Date("nope"))).toBe("");
  });
  it("fromCampusLocalInput reads date-only values as campus midnight and respects explicit zones", () => {
    expect(fromCampusLocalInput("2026-10-20").toISOString()).toBe("2026-10-19T17:00:00.000Z");
    expect(fromCampusLocalInput("2026-10-20T10:16:30").toISOString()).toBe("2026-10-20T03:16:30.000Z");
    expect(fromCampusLocalInput("2026-10-20T03:16:00Z").toISOString()).toBe("2026-10-20T03:16:00.000Z");
    expect(Number.isNaN(fromCampusLocalInput("not a date").getTime())).toBe(true);
  });
});
