// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { notifyNewEnquiry, forwardToCrm } from "@/lib/notify";
import type { FakePrisma } from "@/tests/fake-prisma";
import { POST } from "./route";

vi.mock("@/lib/prisma", async () => {
  const { createFakePrisma } = await import("@/tests/fake-prisma");
  return { prisma: createFakePrisma() };
});
vi.mock("@/lib/notify", () => ({
  notifyNewEnquiry: vi.fn(async () => ({ sent: false })),
  forwardToCrm: vi.fn(async () => ({ sent: false })),
}));

const db = prisma as unknown as FakePrisma;
let ipSeq = 0;
const ip = () => `203.0.113.${++ipSeq}`;

function post(body: unknown, opts: { ip?: string; contentType?: string } = {}) {
  return POST(
    new Request("http://localhost/api/enquiries", {
      method: "POST",
      headers: { "content-type": opts.contentType ?? "application/json", "x-forwarded-for": opts.ip ?? ip() },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const valid = {
  name: "Souphaphone Vong",
  email: "soup@example.com",
  phone: "+856 20 5555 1234",
  audience: "PARENT",
  programmeSlug: "ncuk-international-foundation-year",
  destinationSlug: "united-kingdom",
  utmCampaign: "open-day-2026",
  utmSource: "facebook",
  message: "Hello",
  consentMarketing: true,
  sessionId: "sess-1",
};

beforeEach(() => {
  db._reset();
  vi.mocked(notifyNewEnquiry).mockClear();
  vi.mocked(forwardToCrm).mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/enquiries", () => {
  it("returns 422 with field errors on bad input and stores nothing", async () => {
    const res = await post({ name: "A", email: "nope" });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errors.name).toBeTruthy();
    expect(body.errors.email).toBeTruthy();
    expect(db.enquiry.create).not.toHaveBeenCalled();
  });

  it("returns 400 on an unparseable body", async () => {
    const res = await post("{not json");
    expect(res.status).toBe(400);
    expect(db.enquiry.create).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot submissions with 200 and stores nothing", async () => {
    const res = await post({ ...valid, website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(db.enquiry.create).not.toHaveBeenCalled();
    expect(db.auditLog.create).not.toHaveBeenCalled();
    expect(db.analyticsEvent.create).not.toHaveBeenCalled();
  });

  it("creates the enquiry, resolves references, tracks, audits and notifies (201)", async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ ok: true, id: expect.stringMatching(/^enq_/) });

    expect(db.enquiry.create).toHaveBeenCalledTimes(1);
    const data = db.enquiry.create.mock.calls[0][0].data;
    expect(data.type).toBe("ENQUIRY");
    expect(data.status).toBe("NEW");
    expect(data.programmeId).toBe("prog_pub");
    expect(data.destinationId).toBe("dest_uk");
    expect(data.campaignId).toBe("camp_1");
    expect(data.audience).toBe("PARENT");
    expect(data.consentMarketing).toBe(true);
    expect(data.source).toBe("enquiry-form");
    expect(db.consultation.create).not.toHaveBeenCalled();

    expect(db.analyticsEvent.create).toHaveBeenCalledTimes(1);
    const evt = db.analyticsEvent.create.mock.calls[0][0].data;
    expect(evt.name).toBe("enquiry_submitted");
    expect(evt.sessionId).toBe("sess-1");
    expect(evt.utmCampaign).toBe("open-day-2026");
    expect(JSON.parse(evt.propsJson as string)).toMatchObject({ programme: "ncuk-international-foundation-year", destination: "united-kingdom" });

    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
    const audit = db.auditLog.create.mock.calls[0][0].data;
    expect(audit.action).toBe("CREATE");
    expect(audit.entityType).toBe("Enquiry");
    expect(audit.entityId).toBe(body.id);
    expect(audit.actorId).toBeNull();
    expect(audit.afterJson).not.toContain("soup@example.com");

    await vi.waitFor(() => expect(notifyNewEnquiry).toHaveBeenCalledTimes(1));
    expect(forwardToCrm).toHaveBeenCalledTimes(1);
    expect(vi.mocked(notifyNewEnquiry).mock.calls[0][0]).toMatchObject({ id: body.id, email: "soup@example.com", programme: { slug: "ncuk-international-foundation-year" } });
  });

  it("ignores unknown or unpublished programme/destination/campaign references", async () => {
    const res = await post({ ...valid, programmeSlug: "draft-programme", destinationSlug: "nowhere", utmCampaign: "unknown-campaign" });
    expect(res.status).toBe(201);
    const data = db.enquiry.create.mock.calls[0][0].data;
    expect(data.programmeId).toBeNull();
    expect(data.destinationId).toBeNull();
    expect(data.campaignId).toBeNull();
    expect(data.utmCampaign).toBe("unknown-campaign"); // raw attribution is still kept
  });

  it("accepts form-encoded bodies and honours type=visit", async () => {
    const form = new URLSearchParams({ name: "Ann Lee", email: "ann@example.com", consentMarketing: "on", type: "visit" });
    const res = await post(form.toString(), { contentType: "application/x-www-form-urlencoded" });
    expect(res.status).toBe(201);
    const data = db.enquiry.create.mock.calls[0][0].data;
    expect(data.type).toBe("VISIT");
    expect(data.consentMarketing).toBe(true);
  });

  it("never echoes personal or internal fields in any response", async () => {
    const ok = await (await post(valid)).text();
    for (const leak of ["soup@example.com", "Souphaphone", "+856", "prog_pub", "camp_1", "NEW"]) expect(ok).not.toContain(leak);
    const bad = await (await post({ ...valid, email: "bad", message: "secret-note" })).text();
    expect(bad).not.toContain("secret-note");
    expect(bad).not.toContain("Souphaphone");
  });

  it("rate limits after 5 submissions per IP with Retry-After", async () => {
    const sameIp = ip();
    for (let i = 0; i < 5; i++) expect((await post(valid, { ip: sameIp })).status).toBe(201);
    const res = await post(valid, { ip: sameIp });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await res.json()).ok).toBe(false);
    expect(db.enquiry.create).toHaveBeenCalledTimes(5);
  });

  it("still returns 201 when analytics/audit fail (lead is never lost)", async () => {
    db.analyticsEvent.create.mockRejectedValueOnce(new Error("db down"));
    db.auditLog.create.mockRejectedValueOnce(new Error("db down"));
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect(db.enquiry.create).toHaveBeenCalledTimes(1);
  });
});
