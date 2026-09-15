// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { notifyNewEnquiry, forwardToCrm } from "@/lib/notify";
import { todayIsoDate } from "@/lib/schemas/enquiry";
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
const ip = () => `198.51.100.${++ipSeq}`;
const future = todayIsoDate(new Date(Date.now() + 5 * 86_400_000));
const past = todayIsoDate(new Date(Date.now() - 5 * 86_400_000));

function post(body: unknown, opts: { ip?: string } = {}) {
  return POST(
    new Request("http://localhost/api/consultations", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": opts.ip ?? ip() },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const valid = {
  name: "Ann Lee",
  email: "ann@example.com",
  audience: "STUDENT",
  programmeSlug: "ncuk-international-foundation-year",
  pathwaySlug: "ify-business-united-kingdom",
  preferredDate: future,
  preferredTime: "10:00",
  mode: "ONLINE",
};

beforeEach(() => {
  db._reset();
  vi.mocked(notifyNewEnquiry).mockClear();
  vi.mocked(forwardToCrm).mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/consultations", () => {
  it("422 on missing or invalid booking fields", async () => {
    const res = await post({ ...valid, preferredDate: past, preferredTime: "23:00", mode: "SMOKE_SIGNAL" });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(Object.keys(body.errors).sort()).toEqual(["mode", "preferredDate", "preferredTime"]);
    expect(db.enquiry.create).not.toHaveBeenCalled();
    expect(db.consultation.create).not.toHaveBeenCalled();
  });

  it("422 when the enquiry basics are missing too", async () => {
    const res = await post({ preferredDate: future, preferredTime: "10:00" });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errors.name).toBeTruthy();
    expect(body.errors.email).toBeTruthy();
  });

  it("200 silently on honeypot", async () => {
    const res = await post({ ...valid, website: "spam" });
    expect(res.status).toBe(200);
    expect(db.enquiry.create).not.toHaveBeenCalled();
  });

  it("201 creates Enquiry(type=CONSULTATION) + Consultation, tracks and audits", async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const enquiry = db.enquiry.create.mock.calls[0][0].data;
    expect(enquiry.type).toBe("CONSULTATION");
    expect(enquiry.programmeId).toBe("prog_pub");
    expect(enquiry.source).toBe("consultation-form");

    expect(db.consultation.create).toHaveBeenCalledTimes(1);
    const consultation = db.consultation.create.mock.calls[0][0].data;
    expect(consultation.enquiryId).toBe(body.id);
    expect(consultation.preferredTime).toBe("10:00");
    expect(consultation.mode).toBe("ONLINE");
    expect((consultation.preferredDate as Date).toISOString()).toBe(`${future}T00:00:00.000Z`);

    const evt = db.analyticsEvent.create.mock.calls[0][0].data;
    expect(evt.name).toBe("consultation_requested");
    expect(JSON.parse(evt.propsJson as string)).toMatchObject({ programme: "ncuk-international-foundation-year", pathway: "ify-business-united-kingdom" });

    const audit = db.auditLog.create.mock.calls[0][0].data;
    expect(audit.action).toBe("CREATE");
    expect(audit.actorId).toBeNull();
    expect(JSON.parse(audit.afterJson as string).consultation).toEqual({ preferredDate: future, preferredTime: "10:00", mode: "ONLINE" });
    expect(audit.afterJson).not.toContain("ann@example.com");

    await vi.waitFor(() => expect(notifyNewEnquiry).toHaveBeenCalledTimes(1));
    expect(vi.mocked(notifyNewEnquiry).mock.calls[0][0].consultation).toEqual({ preferredDate: future, preferredTime: "10:00", mode: "ONLINE" });
    expect(forwardToCrm).toHaveBeenCalledTimes(1);
  });

  it("does not echo the submitted data", async () => {
    const text = await (await post(valid)).text();
    expect(text).not.toContain("ann@example.com");
    expect(text).not.toContain("Ann Lee");
    expect(text).not.toContain(future);
  });

  it("429 after 5 per IP", async () => {
    const sameIp = ip();
    for (let i = 0; i < 5; i++) expect((await post(valid, { ip: sameIp })).status).toBe(201);
    const res = await post(valid, { ip: sameIp });
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
  });
});
