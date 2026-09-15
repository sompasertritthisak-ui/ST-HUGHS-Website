import type { PathwayWithRelations } from "@/lib/content";
import { splitList, toSlug } from "@/lib/utils";

/**
 * Pure, client-safe model for the Pathway Explorer. Every option a user can
 * pick is derived from published pathways, so a combination with no route
 * behind it can never be shown.
 */

export const EXPLORER_STEPS = [
  { key: "start", label: "Starting point", prompt: "Where does the route begin?" },
  { key: "programme", label: "Programme", prompt: "Which programme do you start with?" },
  { key: "subject", label: "Subject", prompt: "Which subject area?" },
  { key: "destination", label: "Destination", prompt: "Where do you want to finish your degree?" },
  { key: "university", label: "University / partner", prompt: "Which university or partner?" },
  { key: "degree", label: "Degree", prompt: "Which qualification do you graduate with?" },
  { key: "career", label: "Career direction", prompt: "Which direction after graduation?" },
] as const;

export type StepKey = (typeof EXPLORER_STEPS)[number]["key"];
/** Only steps a user can pick are stored in the URL. `start` is derived. */
export const URL_KEYS: StepKey[] = ["programme", "subject", "destination", "university", "degree", "career"];
export type Selection = Partial<Record<StepKey, string>>;

export type Option = {
  value: string;
  label: string;
  /** How many published routes carry this option (within the current pool). */
  count: number;
  /** Worst verification status across the routes/entities behind the option. */
  verification: string;
  /** Optional secondary line, e.g. a university's city. */
  meta?: string;
};

type Candidate = Omit<Option, "count">;

const VERIFICATION_RANK: Record<string, number> = { VERIFIED: 0, PENDING: 1, UNVERIFIED: 2 };
function worst(a: string, b: string) {
  return (VERIFICATION_RANK[b] ?? 1) > (VERIFICATION_RANK[a] ?? 1) ? b : a;
}

/** Candidates a single pathway contributes for a given step. */
export function candidatesFor(p: PathwayWithRelations, key: StepKey): Candidate[] {
  switch (key) {
    case "start":
      return [{ value: toSlug(p.startLocation), label: p.startLocation, verification: "VERIFIED" }];
    case "programme":
      return p.programme
        ? [{ value: p.programme.slug, label: p.programme.shortTitle ?? p.programme.title, verification: p.verificationStatus }]
        : [{ value: "partner-route", label: "Partner bachelor route", verification: p.verificationStatus }];
    case "subject":
      return p.subjectArea ? [{ value: toSlug(p.subjectArea), label: p.subjectArea, verification: p.verificationStatus }] : [];
    case "destination":
      return p.destination
        ? [{ value: p.destination.slug, label: p.destination.country, verification: p.destination.verificationStatus, meta: p.destination.region ?? undefined }]
        : [];
    case "university":
      if (p.university) {
        return [{ value: p.university.slug, label: p.university.name, verification: p.university.verificationStatus, meta: p.university.city ?? undefined }];
      }
      return p.partnerName ? [{ value: toSlug(p.partnerName), label: p.partnerName, verification: p.verificationStatus }] : [];
    case "degree":
      return p.qualification ? [{ value: toSlug(p.qualification), label: p.qualification, verification: p.verificationStatus }] : [];
    case "career":
      return splitList(p.careerDirections).map((c) => ({ value: toSlug(c), label: c, verification: p.verificationStatus }));
  }
}

/** Distinct options for a step across a pool of pathways, in first-seen order. */
export function optionsFor(pool: PathwayWithRelations[], key: StepKey): Option[] {
  const map = new Map<string, Option>();
  for (const p of pool) {
    for (const c of candidatesFor(p, key)) {
      const existing = map.get(c.value);
      if (existing) {
        existing.count += 1;
        existing.verification = worst(existing.verification, c.verification);
      } else {
        map.set(c.value, { ...c, count: 1 });
      }
    }
  }
  return [...map.values()];
}

export function pathwayHas(p: PathwayWithRelations, key: StepKey, value: string) {
  return candidatesFor(p, key).some((c) => c.value === value);
}

export type StepStatus = "done" | "auto" | "current" | "pending" | "skipped";
export type ResolvedStep = {
  key: StepKey;
  label: string;
  prompt: string;
  status: StepStatus;
  options: Option[];
  /** The chosen (or auto-resolved) option. */
  chosen?: Option;
};

export type Resolution = {
  steps: ResolvedStep[];
  /** Pathways matching every resolved step so far. */
  matched: PathwayWithRelations[];
  /** True when no further choice is needed. */
  complete: boolean;
  current: ResolvedStep | null;
};

/**
 * Walk the steps in order. A step with a single option resolves itself; a
 * step with none is skipped; the first step with several options and no
 * valid selection becomes the current question. Selections that are no
 * longer valid (e.g. after an upstream change) are ignored.
 */
export function resolve(all: PathwayWithRelations[], selection: Selection): Resolution {
  let pool = all;
  const steps: ResolvedStep[] = [];
  let current: ResolvedStep | null = null;

  for (const def of EXPLORER_STEPS) {
    const base = { key: def.key, label: def.label, prompt: def.prompt };
    if (current) {
      steps.push({ ...base, status: "pending", options: [] });
      continue;
    }
    const options = optionsFor(pool, def.key);
    if (options.length === 0) {
      steps.push({ ...base, status: "skipped", options });
      continue;
    }
    const wanted = selection[def.key];
    const chosen = wanted ? options.find((o) => o.value === wanted) : undefined;
    if (chosen) {
      pool = pool.filter((p) => pathwayHas(p, def.key, chosen.value));
      steps.push({ ...base, status: "done", options, chosen });
    } else if (options.length === 1) {
      pool = pool.filter((p) => pathwayHas(p, def.key, options[0].value));
      steps.push({ ...base, status: "auto", options, chosen: options[0] });
    } else {
      current = { ...base, status: "current", options };
      steps.push(current);
    }
  }

  return { steps, matched: pool, complete: current === null && pool.length > 0, current };
}

/** Drop every selection at or after `key` (used when the user changes an earlier answer). */
export function truncateSelection(selection: Selection, key: StepKey): Selection {
  const idx = EXPLORER_STEPS.findIndex((s) => s.key === key);
  const next: Selection = {};
  EXPLORER_STEPS.forEach((s, i) => {
    if (i < idx && selection[s.key]) next[s.key] = selection[s.key];
  });
  return next;
}

export function selectionToParams(selection: Selection): URLSearchParams {
  const params = new URLSearchParams();
  for (const k of URL_KEYS) if (selection[k]) params.set(k, selection[k]!);
  return params;
}

export function paramsToSelection(params: URLSearchParams | { get(key: string): string | null }): Selection {
  const s: Selection = {};
  for (const k of URL_KEYS) {
    const v = params.get(k);
    if (v) s[k] = v;
  }
  return s;
}

// ── Map projection ───────────────────────────────────────────────────────────

export const MAP_W = 1000;
export const MAP_H = 500;
/** Visible latitude band; trims the empty polar space from the equirectangular canvas. */
export const MAP_LAT_TOP = 78;
export const MAP_LAT_BOTTOM = -58;

export type Point = { x: number; y: number };

export function project(lat: number, lng: number): Point {
  return { x: ((lng + 180) / 360) * MAP_W, y: ((90 - lat) / 180) * MAP_H };
}

export const MAP_VIEWBOX = (() => {
  const top = project(MAP_LAT_TOP, 0).y;
  const bottom = project(MAP_LAT_BOTTOM, 0).y;
  return { x: 0, y: top, w: MAP_W, h: bottom - top };
})();

/** Quadratic curve lifted toward the pole so long hops read as flight paths. */
export function routePath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    // Perpendicular offset, always bending "up" (towards smaller y).
    const lift = Math.min(dist * 0.28, 110);
    const nx = -dy / (dist || 1);
    const ny = dx / (dist || 1);
    const sign = ny < 0 ? 1 : -1;
    const cx = mx + nx * lift * sign;
    const cy = my + ny * lift * sign;
    d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

export type GeoPoint = { lat: number; lng: number };

/** Ordered, de-duplicated coordinates a pathway travels through. */
export function pathwayGeo(p: PathwayWithRelations, origin: GeoPoint | null): GeoPoint[] {
  const pts: GeoPoint[] = [];
  for (const s of p.steps) {
    if (typeof s.lat === "number" && typeof s.lng === "number") {
      const last = pts[pts.length - 1];
      if (!last || last.lat !== s.lat || last.lng !== s.lng) pts.push({ lat: s.lat, lng: s.lng });
    }
  }
  if (pts.length >= 2) return pts;
  if (origin && p.destination) return [origin, { lat: p.destination.lat, lng: p.destination.lng }];
  return pts;
}

/** The lit origin node: the first located step of any published route. */
export function findOrigin(all: PathwayWithRelations[]): (GeoPoint & { label: string }) | null {
  for (const p of all) {
    const s = p.steps.find((st) => typeof st.lat === "number" && typeof st.lng === "number");
    if (s) return { lat: s.lat as number, lng: s.lng as number, label: s.location ?? p.startLocation };
  }
  return null;
}

/** Plain-language summary for screen readers and the mobile caption. */
export function describeSelection(res: Resolution): string {
  const parts = res.steps.filter((s) => s.chosen).map((s) => `${s.label}: ${s.chosen!.label}`);
  const tail =
    res.matched.length === 1
      ? `One route matches: ${res.matched[0].title}.`
      : `${res.matched.length} routes match.`;
  return parts.length ? `${parts.join(". ")}. ${tail}` : `All ${res.matched.length} published routes shown from the origin.`;
}
