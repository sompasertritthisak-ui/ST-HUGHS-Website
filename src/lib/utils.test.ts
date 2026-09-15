// @vitest-environment node
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseJson, parseStringArray, splitList, toSlug, isPublished, truncate, cn } from "./utils";

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
