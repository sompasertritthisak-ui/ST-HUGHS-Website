// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import type { FakePrisma } from "@/tests/fake-prisma";
import { POST } from "./route";

vi.mock("@/lib/prisma", async () => {
  const { createFakePrisma } = await import("@/tests/fake-prisma");
  return { prisma: createFakePrisma() };
});

const db = prisma as unknown as FakePrisma;
let ipSeq = 0;
const ip = () => `192.0.2.${++ipSeq}`;

function post(body: unknown, opts: { ip?: string; contentType?: string } = {}) {
  return POST(
    new Request("http://localhost/api/analytics/events", {
      method: "POST",
      headers: { "content-type": opts.contentType ?? "application/json", "x-forwarded-for": opts.ip ?? ip() },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  db._reset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/analytics/events", () => {
  it("stores a valid event and returns 204 with no body", async () => {
    const res = await post({ name: "programme_view", path: "/programmes/x", props: { slug: "x", n: 1, ok: true }, sessionId: "s1", utmSource: "fb" });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(db.analyticsEvent.create).toHaveBeenCalledTimes(1);
    const data = db.analyticsEvent.create.mock.calls[0][0].data;
    expect(data.name).toBe("programme_view");
    expect(data.sessionId).toBe("s1");
    expect(JSON.parse(data.propsJson as string)).toEqual({ slug: "x", n: 1, ok: true });
  });

  it("parses sendBeacon text/plain bodies as JSON", async () => {
    const res = await post({ name: "page_view", path: "/" }, { contentType: "text/plain;charset=UTF-8" });
    expect(res.status).toBe(204);
    expect(db.analyticsEvent.create).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown event names, oversized props and garbage with 400", async () => {
    expect((await post({ name: "drop_table" })).status).toBe(400);
    expect((await post({ name: "page_view", props: { x: { nested: true } } })).status).toBe(400);
    expect((await post("not json")).status).toBe(400);
    expect((await post({ name: "page_view", path: "x".repeat(501) })).status).toBe(400);
    expect(db.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it("rejects bodies over 8KB", async () => {
    const res = await post({ name: "page_view", props: { big: "x".repeat(9000) } });
    expect(res.status).toBe(400);
  });

  it("swallows storage failures (204) so pages never break", async () => {
    db.analyticsEvent.create.mockRejectedValueOnce(new Error("db down"));
    expect((await post({ name: "page_view" })).status).toBe(204);
  });

  it("rate limits at 60 per minute per IP", async () => {
    const sameIp = ip();
    for (let i = 0; i < 60; i++) expect((await post({ name: "page_view" }, { ip: sameIp })).status).toBe(204);
    const res = await post({ name: "page_view" }, { ip: sameIp });
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
    expect((await post({ name: "page_view" })).status).toBe(204); // other IPs unaffected
  });
});
