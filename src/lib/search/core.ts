/**
 * Site search ranking — pure and dependency-free so it runs in tests, on the server and in the browser.
 *
 * The catalogue is small (tens to a few hundred published records), so a ranked in-memory scan beats a search
 * service: no extra infrastructure, identical results on SQLite (dev) and Postgres (prod), and instant.
 */

export type SearchKind = "page" | "programme" | "pathway" | "destination" | "university" | "faq" | "news" | "event" | "story" | "document";

export type SearchDoc = {
  kind: SearchKind;
  title: string;
  href: string;
  /** One line shown under the title. */
  summary?: string;
  /** Short context label, e.g. the university or country. */
  meta?: string;
  /** Extra words that should match but are not displayed (synonyms, codes, Lao/English variants). */
  keywords?: string;
  /** Body text searched at a lower weight. */
  body?: string;
};

export type SearchHit = SearchDoc & { score: number };

export const KIND_LABELS: Record<SearchKind, string> = {
  page: "Pages",
  programme: "Programmes",
  pathway: "Pathways",
  destination: "Destinations",
  university: "Universities",
  faq: "Questions",
  news: "News",
  event: "Events",
  story: "Student stories",
  document: "Documents",
};

/** Small boost so primary content outranks incidental matches at equal relevance. */
const KIND_WEIGHT: Record<SearchKind, number> = {
  page: 1.15,
  programme: 1.3,
  pathway: 1.1,
  destination: 1.2,
  university: 1.15,
  faq: 1,
  news: 0.85,
  event: 0.85,
  story: 0.9,
  document: 0.8,
};

/** Lower-case, strip accents and punctuation, collapse whitespace. Keeps "+" so "2+2" and "1+3" stay searchable. */
export function normalise(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}+]+/gu, " ")
    .trim();
}

const STOP = new Set(["a", "an", "the", "of", "and", "or", "in", "to", "for", "at", "on", "is", "do", "i", "my", "what", "how", "can"]);

export function tokenise(query: string): string[] {
  const tokens = normalise(query).split(" ").filter(Boolean);
  const meaningful = tokens.filter((t) => !STOP.has(t));
  return meaningful.length ? meaningful : tokens;
}

function fieldScore(field: string, token: string, weight: number): number {
  if (!field) return 0;
  if (field === token) return weight * 3;
  const words = field.split(" ");
  if (words.includes(token)) return weight * 2;
  if (words.some((w) => w.startsWith(token))) return weight * 1.5;
  if (token.length >= 3 && field.includes(token)) return weight;
  return 0;
}

/** Rank documents for a query. Every query token must match somewhere (AND), so results narrow as you type. */
export function rank(docs: SearchDoc[], query: string, limit = 24): SearchHit[] {
  const tokens = tokenise(query);
  if (!tokens.length) return [];
  const phrase = normalise(query);
  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const title = normalise(doc.title);
    const meta = normalise(doc.meta ?? "");
    const keywords = normalise(doc.keywords ?? "");
    const summary = normalise(doc.summary ?? "");
    const body = normalise(doc.body ?? "");
    let total = 0;
    let missed = false;
    for (const token of tokens) {
      const s = Math.max(
        fieldScore(title, token, 10),
        fieldScore(keywords, token, 7),
        fieldScore(meta, token, 6),
        fieldScore(summary, token, 4),
        fieldScore(body, token, 2),
      );
      if (s === 0) {
        missed = true;
        break;
      }
      total += s;
    }
    if (missed) continue;
    if (phrase.length > 2 && title.includes(phrase)) total += 12;
    if (title.startsWith(phrase)) total += 6;
    hits.push({ ...doc, score: total * KIND_WEIGHT[doc.kind] });
  }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

/** Group ranked hits by kind, keeping the order in which each kind first appears (best group first). */
export function groupHits(hits: SearchHit[]): { kind: SearchKind; label: string; hits: SearchHit[] }[] {
  const groups = new Map<SearchKind, SearchHit[]>();
  for (const hit of hits) {
    const list = groups.get(hit.kind) ?? [];
    list.push(hit);
    groups.set(hit.kind, list);
  }
  return [...groups.entries()].map(([kind, list]) => ({ kind, label: KIND_LABELS[kind], hits: list }));
}

/** Plain-text excerpt (strips Markdown) clipped to `max` characters on a word boundary. */
export function excerpt(text: string | null | undefined, max = 140): string {
  if (!text) return "";
  const plain = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/(\*\*|__|\*|_|`|~~)(?=\S)([^\n]*?\S)\1/g, "$2")
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : max).trimEnd() + "…";
}
