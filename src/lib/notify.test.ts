// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { notifyNewEnquiry, forwardToCrm, type EnquiryNotification } from "./notify";

const enquiry: EnquiryNotification = {
  id: "enq_1",
  type: "CONSULTATION",
  name: "Ann <Lee>",
  email: "ann@example.com",
  audience: "STUDENT",
  consentMarketing: false,
  consultation: { preferredDate: "2030-01-01", preferredTime: "10:00", mode: "ONLINE" },
  createdAt: "2026-01-01T00:00:00.000Z",
};

const ENV = ["EMAIL_API_KEY", "ADMISSIONS_NOTIFY_EMAIL", "CRM_WEBHOOK_URL", "CRM_API_KEY"] as const;

beforeEach(() => {
  for (const k of ENV) delete process.env[k];
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("notifyNewEnquiry", () => {
  it("logs a structured line without personal data when email is not configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const r = await notifyNewEnquiry(enquiry);
    expect(r.sent).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    const line = (console.info as unknown as { mock: { calls: string[][] } }).mock.calls[0][0];
    expect(JSON.parse(line).event).toBe("enquiry.notify.skipped");
    expect(line).not.toContain("ann@example.com");
  });

  it("posts a Resend-shaped payload with a bearer token", async () => {
    process.env.EMAIL_API_KEY = "re_test";
    process.env.ADMISSIONS_NOTIFY_EMAIL = "a@shv.test, b@shv.test";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const r = await notifyNewEnquiry(enquiry);
    expect(r.sent).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(["a@shv.test", "b@shv.test"]);
    expect(body.reply_to).toBe("ann@example.com");
    expect(body.subject).toContain("consultation request");
    expect(body.html).toContain("&lt;Lee&gt;"); // escaped
  });

  it("never throws when the provider fails", async () => {
    process.env.EMAIL_API_KEY = "re_test";
    process.env.ADMISSIONS_NOTIFY_EMAIL = "a@shv.test";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("boom"));
    await expect(notifyNewEnquiry(enquiry)).resolves.toEqual({ sent: false, reason: "error" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(notifyNewEnquiry(enquiry)).resolves.toEqual({ sent: false, reason: "http-500" });
  });
});

describe("forwardToCrm", () => {
  it("is a no-op without CRM_WEBHOOK_URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(forwardToCrm(enquiry)).resolves.toEqual({ sent: false, reason: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts {event, enquiry} with an optional bearer", async () => {
    process.env.CRM_WEBHOOK_URL = "https://crm.example/hook";
    process.env.CRM_API_KEY = "crm_secret";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 202 }));
    await expect(forwardToCrm(enquiry)).resolves.toEqual({ sent: true });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://crm.example/hook");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer crm_secret");
    const body = JSON.parse(init.body as string);
    expect(body.event).toBe("enquiry.created");
    expect(body.enquiry.id).toBe("enq_1");
  });

  it("swallows network errors", async () => {
    process.env.CRM_WEBHOOK_URL = "https://crm.example/hook";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));
    await expect(forwardToCrm(enquiry)).resolves.toEqual({ sent: false, reason: "error" });
  });
});
