// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { authConfig } from "./auth.config";

const authorized = (pathname: string, session: Session | null) =>
  authConfig.callbacks.authorized({
    auth: session,
    request: { nextUrl: new URL(`http://localhost${pathname}`) } as unknown as NextRequest,
  });

const session = { user: { id: "u1", role: "EDITOR" }, expires: "2099-01-01" } as unknown as Session;

describe("authConfig.authorized", () => {
  it("blocks /admin and /api/admin without a session", () => {
    expect(authorized("/admin", null)).toBe(false);
    expect(authorized("/admin/programmes/123", null)).toBe(false);
    expect(authorized("/api/admin/users", null)).toBe(false);
  });

  it("allows the login page and public routes without a session", () => {
    expect(authorized("/admin/login", null)).toBe(true);
    expect(authorized("/", null)).toBe(true);
    expect(authorized("/programmes", null)).toBe(true);
    expect(authorized("/api/programmes", null)).toBe(true);
    expect(authorized("/api/enquiries", null)).toBe(true);
  });

  it("allows admin routes with a session", () => {
    expect(authorized("/admin", session)).toBe(true);
    expect(authorized("/api/admin/analytics", session)).toBe(true);
  });

  it("uses JWT sessions with an 8h max age and the admin login page", () => {
    expect(authConfig.session.strategy).toBe("jwt");
    expect(authConfig.session.maxAge).toBe(60 * 60 * 8);
    expect(authConfig.pages.signIn).toBe("/admin/login");
  });
});
