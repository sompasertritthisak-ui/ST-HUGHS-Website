// @vitest-environment node
import { describe, it, expect } from "vitest";
import { can, canTransitionTo, permissionsFor } from "./rbac";
import { ROLES } from "./enums";

describe("rbac.can", () => {
  it("grants SUPER_ADMIN everything", () => {
    expect(can("SUPER_ADMIN", "users.manage")).toBe(true);
    expect(can("SUPER_ADMIN", "content.publish")).toBe(true);
  });

  it("denies when role is missing or unknown", () => {
    expect(can(null, "content.read")).toBe(false);
    expect(can(undefined, "content.read")).toBe(false);
    expect(can("", "content.read")).toBe(false);
    expect(can("HACKER", "content.read")).toBe(false);
  });

  it("enforces the matrix for each role", () => {
    expect(can("EDITOR", "content.create")).toBe(true);
    expect(can("EDITOR", "content.publish")).toBe(false);
    expect(can("EDITOR", "enquiries.read")).toBe(false);
    expect(can("CONTENT_ADMIN", "content.publish")).toBe(true);
    expect(can("CONTENT_ADMIN", "users.manage")).toBe(false);
    expect(can("ADMISSIONS", "enquiries.update")).toBe(true);
    expect(can("ADMISSIONS", "content.update")).toBe(false);
    expect(can("MARKETING", "campaigns.manage")).toBe(true);
    expect(can("MARKETING", "enquiries.update")).toBe(false);
    expect(can("VIEWER", "content.read")).toBe(true);
    expect(can("VIEWER", "content.create")).toBe(false);
  });

  it("only SUPER_ADMIN can manage users (privilege escalation guard)", () => {
    for (const role of ROLES) expect(can(role, "users.manage")).toBe(role === "SUPER_ADMIN");
  });

  it("permissionsFor returns [] for unknown roles", () => {
    expect(permissionsFor("nope")).toEqual([]);
    expect(permissionsFor(null)).toEqual([]);
    expect(permissionsFor("VIEWER")).toContain("content.read");
  });
});

describe("rbac.canTransitionTo", () => {
  it("maps workflow targets to permissions", () => {
    expect(canTransitionTo("EDITOR", "IN_REVIEW")).toBe(true);
    expect(canTransitionTo("EDITOR", "APPROVED")).toBe(false);
    expect(canTransitionTo("EDITOR", "PUBLISHED")).toBe(false);
    expect(canTransitionTo("EDITOR", "DRAFT")).toBe(true);
    expect(canTransitionTo("EDITOR", "ARCHIVED")).toBe(false);
    expect(canTransitionTo("CONTENT_ADMIN", "PUBLISHED")).toBe(true);
    expect(canTransitionTo("CONTENT_ADMIN", "ARCHIVED")).toBe(true);
    expect(canTransitionTo("SUPER_ADMIN", "APPROVED")).toBe(true);
    expect(canTransitionTo("VIEWER", "IN_REVIEW")).toBe(false);
  });

  it("rejects unknown statuses and missing roles", () => {
    expect(canTransitionTo("SUPER_ADMIN", "BOGUS")).toBe(false);
    expect(canTransitionTo(null, "PUBLISHED")).toBe(false);
  });
});
