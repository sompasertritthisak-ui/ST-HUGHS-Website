// @vitest-environment node
import { describe, it, expect } from "vitest";
import { EnquirySchema, ConsultationSchema, todayIsoDate, toFieldErrors, isHoneypotTripped, CONSULTATION_TIME_SLOTS } from "./enquiry";

const shift = (days: number) => todayIsoDate(new Date(Date.now() + days * 86_400_000));

const valid = {
  name: "Souphaphone Vong",
  email: "Souphaphone@Example.com",
  phone: "+856 20 5555 1234",
  audience: "STUDENT",
  programmeSlug: "ncuk-international-foundation-year",
  message: "Hello",
  consentMarketing: true,
  website: "",
};

describe("EnquirySchema", () => {
  it("accepts a valid enquiry and normalises email", () => {
    const r = EnquirySchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("souphaphone@example.com");
      expect(r.data.type).toBe("ENQUIRY");
      expect(r.data.consentMarketing).toBe(true);
    }
  });

  it("accepts form-encoded string values", () => {
    const r = EnquirySchema.safeParse({ name: "Ann Lee", email: "a@b.co", consentMarketing: "on", phone: "", programmeSlug: "", audience: "", type: "visit" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.consentMarketing).toBe(true);
      expect(r.data.phone).toBeUndefined();
      expect(r.data.programmeSlug).toBeUndefined();
      expect(r.data.audience).toBe("STUDENT");
      expect(r.data.type).toBe("VISIT");
    }
  });

  it("rejects short names, bad emails, bad phones, long messages and bad slugs", () => {
    const r = EnquirySchema.safeParse({ ...valid, name: "A", email: "nope", phone: "abc", message: "x".repeat(2001), programmeSlug: "../etc" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errors = toFieldErrors(r.error);
      expect(Object.keys(errors).sort()).toEqual(["email", "message", "name", "phone", "programmeSlug"]);
      expect(errors.name[0]).toMatch(/name/i);
    }
  });

  it("rejects unknown audience and consultation type via the public API", () => {
    expect(EnquirySchema.safeParse({ ...valid, audience: "ALIEN" }).success).toBe(false);
    expect(EnquirySchema.safeParse({ ...valid, type: "CONSULTATION" }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    const r = EnquirySchema.safeParse({ ...valid, website: "http://spam.example" });
    expect(r.success).toBe(false);
    expect(isHoneypotTripped({ website: "x" })).toBe(true);
    expect(isHoneypotTripped({ website: "  " })).toBe(false);
    expect(isHoneypotTripped({})).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });

  it("defaults consentMarketing to false and strips unknown keys", () => {
    const r = EnquirySchema.safeParse({ name: "Ann Lee", email: "a@b.co", status: "CONVERTED", assignedToId: "u1" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.consentMarketing).toBe(false);
      expect((r.data as Record<string, unknown>).status).toBeUndefined();
      expect((r.data as Record<string, unknown>).assignedToId).toBeUndefined();
    }
  });
});

describe("ConsultationSchema", () => {
  const base = { ...valid, preferredTime: "10:00", mode: "ONLINE" };

  it("accepts today and future dates", () => {
    expect(ConsultationSchema.safeParse({ ...base, preferredDate: todayIsoDate() }).success).toBe(true);
    expect(ConsultationSchema.safeParse({ ...base, preferredDate: shift(3) }).success).toBe(true);
  });

  it("rejects past, malformed and impossible dates", () => {
    expect(ConsultationSchema.safeParse({ ...base, preferredDate: shift(-3) }).success).toBe(false);
    expect(ConsultationSchema.safeParse({ ...base, preferredDate: "01/02/2030" }).success).toBe(false);
    expect(ConsultationSchema.safeParse({ ...base, preferredDate: "2030-13-40" }).success).toBe(false);
    expect(ConsultationSchema.safeParse({ ...base, preferredDate: "" }).success).toBe(false);
  });

  it("requires a listed time slot and a known mode", () => {
    expect(CONSULTATION_TIME_SLOTS).toContain("09:00");
    expect(ConsultationSchema.safeParse({ ...base, preferredDate: shift(1), preferredTime: "23:59" }).success).toBe(false);
    expect(ConsultationSchema.safeParse({ ...base, preferredDate: shift(1), preferredTime: "" }).success).toBe(false);
    expect(ConsultationSchema.safeParse({ ...base, preferredDate: shift(1), mode: "TELEPATHY" }).success).toBe(false);
    const r = ConsultationSchema.safeParse({ ...base, preferredDate: shift(1), mode: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.mode).toBe("IN_PERSON");
  });

  it("todayIsoDate formats in the campus time zone", () => {
    expect(todayIsoDate(new Date("2026-03-01T20:30:00Z"))).toBe("2026-03-02"); // 03:30 next day in Vientiane (UTC+7)
    expect(todayIsoDate(new Date("2026-03-01T10:00:00Z"))).toBe("2026-03-01");
  });
});
