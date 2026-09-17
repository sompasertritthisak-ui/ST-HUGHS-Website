// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  CONTENT_STATUSES,
  STATUS_TRANSITIONS,
  CONTENT_STATUS_LABELS,
  ROLES,
  ROLE_LABELS,
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  AUDIENCES,
  AUDIENCE_LABELS,
  CONSULTATION_MODES,
  CONSULTATION_MODE_LABELS,
  ANALYTICS_EVENTS,
  AnalyticsEventSchema,
  type ContentStatus,
} from "./enum-schemas";

describe("STATUS_TRANSITIONS", () => {
  it("defines transitions for every content status and only to valid statuses", () => {
    expect(Object.keys(STATUS_TRANSITIONS).sort()).toEqual([...CONTENT_STATUSES].sort());
    for (const [from, targets] of Object.entries(STATUS_TRANSITIONS)) {
      expect(targets.length).toBeGreaterThan(0);
      for (const to of targets) {
        expect(CONTENT_STATUSES).toContain(to);
        expect(to).not.toBe(from);
      }
    }
  });

  it("makes every status reachable from DRAFT", () => {
    const seen = new Set<ContentStatus>(["DRAFT"]);
    const queue: ContentStatus[] = ["DRAFT"];
    while (queue.length) {
      const cur = queue.shift() as ContentStatus;
      for (const next of STATUS_TRANSITIONS[cur]) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect([...seen].sort()).toEqual([...CONTENT_STATUSES].sort());
  });

  it("never publishes directly from DRAFT (review gate)", () => {
    expect(STATUS_TRANSITIONS.DRAFT).not.toContain("PUBLISHED");
    expect(STATUS_TRANSITIONS.IN_REVIEW).not.toContain("PUBLISHED");
    expect(STATUS_TRANSITIONS.APPROVED).toContain("PUBLISHED");
  });

  it("lets archived content be restored", () => {
    expect(STATUS_TRANSITIONS.ARCHIVED).toContain("DRAFT");
  });
});

describe("labels", () => {
  it("has a label for every enum value", () => {
    for (const s of CONTENT_STATUSES) expect(CONTENT_STATUS_LABELS[s]).toBeTruthy();
    for (const r of ROLES) expect(ROLE_LABELS[r]).toBeTruthy();
    for (const s of ENQUIRY_STATUSES) expect(ENQUIRY_STATUS_LABELS[s]).toBeTruthy();
    for (const a of AUDIENCES) expect(AUDIENCE_LABELS[a]).toBeTruthy();
    for (const m of CONSULTATION_MODES) expect(CONSULTATION_MODE_LABELS[m]).toBeTruthy();
  });

  it("covers the funnel events the brief requires", () => {
    for (const name of ["page_view", "programme_view", "pathway_interaction", "destination_click", "university_click", "enquiry_submitted", "consultation_requested", "apply_click", "brochure_download", "outbound_partner_click"]) {
      expect(ANALYTICS_EVENTS).toContain(name);
    }
    expect(AnalyticsEventSchema.safeParse("drop_table").success).toBe(false);
  });
});
