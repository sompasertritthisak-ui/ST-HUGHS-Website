// @vitest-environment node
import { describe, it, expect } from "vitest";
import { excerpt, groupHits, normalise, rank, tokenise, type SearchDoc } from "./core";

const docs: SearchDoc[] = [
  { kind: "programme", title: "International Foundation Year", href: "/programmes/ify", summary: "NCUK foundation programme.", keywords: "IFY NCUK" },
  { kind: "programme", title: "International Year One — Business Management", href: "/programmes/iyo", keywords: "IYOne NCUK" },
  { kind: "programme", title: "Bachelor in International Business 1+3", href: "/programmes/esdes", meta: "Bachelor pathway" },
  { kind: "university", title: "Assumption University of Thailand", href: "/universities/au", meta: "Bangkok, Thailand" },
  { kind: "faq", title: "What are the English requirements?", href: "/faqs#english", body: "IELTS 5.5 or the SHV placement test." },
  { kind: "page", title: "Admissions", href: "/admissions", keywords: "apply application entry requirements" },
  { kind: "destination", title: "Việt Nam", href: "/destinations/vietnam", keywords: "VN" },
];

describe("search core", () => {
  it("normalises accents, case, apostrophes and punctuation but keeps +", () => {
    expect(normalise("St Hugh’s — Việt Nam 1+3!")).toBe("st hughs viet nam 1+3");
  });
  it("drops stop words unless the query is only stop words", () => {
    expect(tokenise("how do I apply")).toEqual(["apply"]);
    expect(tokenise("the")).toEqual(["the"]);
  });
  it("ranks title matches first and requires every token", () => {
    const hits = rank(docs, "foundation");
    expect(hits[0].href).toBe("/programmes/ify");
    expect(rank(docs, "foundation thailand")).toEqual([]);
  });
  it("matches prefixes as you type, keywords, meta and body text", () => {
    expect(rank(docs, "found")[0].href).toBe("/programmes/ify");
    expect(rank(docs, "ify")[0].href).toBe("/programmes/ify");
    expect(rank(docs, "bangkok")[0].href).toBe("/universities/au");
    expect(rank(docs, "ielts")[0].href).toBe("/faqs#english");
    expect(rank(docs, "1+3")[0].href).toBe("/programmes/esdes");
    expect(rank(docs, "viet nam")[0].href).toBe("/destinations/vietnam");
  });
  it("finds pages by what people type", () => {
    expect(rank(docs, "how do i apply")[0].href).toBe("/admissions");
    const req = rank(docs, "requirements").map((h) => h.href);
    expect(req).toContain("/admissions");
    expect(req).toContain("/faqs#english");
  });
  it("returns nothing for empty queries and respects the limit", () => {
    expect(rank(docs, "   ")).toEqual([]);
    expect(rank(docs, "international", 1)).toHaveLength(1);
  });
  it("groups by kind in rank order", () => {
    const groups = groupHits(rank(docs, "international"));
    expect(groups[0].kind).toBe("programme");
    expect(groups.flatMap((g) => g.hits)).toHaveLength(3);
  });
  it("excerpts strip markdown and clip on a word boundary", () => {
    expect(excerpt("## Title\n\nSee [our page](/x) for **details**.")).toBe("Title See our page for details.");
    expect(excerpt("- five 8-week levels, a 24-week internship")).toBe("five 8-week levels, a 24-week internship");
    const long = excerpt("word ".repeat(80), 60);
    expect(long.endsWith("…")).toBe(true);
    expect(long.length).toBeLessThanOrEqual(61);
  });
});
