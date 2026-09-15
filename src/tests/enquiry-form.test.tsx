import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { EnquiryForm } from "@/components/forms/enquiry-form";

const programmes = [{ slug: "ncuk-international-foundation-year", title: "NCUK International Foundation Year", shortTitle: "IFY" }];
const destinations = [{ slug: "united-kingdom", country: "United Kingdom" }];

beforeEach(() => {
  vi.spyOn(globalThis, "fetch");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("<EnquiryForm>", () => {
  it("renders labelled fields, options, privacy link and honeypot", () => {
    render(<EnquiryForm programmes={programmes} destinations={destinations} defaults={{ programmeSlug: "ncuk-international-foundation-year", audience: "parent" }} whatsappHref="https://wa.me/85620555" />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country of residence/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i am a/i)).toHaveValue("PARENT");
    expect(screen.getByLabelText(/programme of interest/i)).toHaveValue("ncuk-international-foundation-year");
    expect(screen.getByRole("option", { name: "IFY" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "United Kingdom" })).toBeInTheDocument();
    expect(screen.getByLabelText(/your message/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/keep me informed/i)).not.toBeChecked();
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute("href", "https://wa.me/85620555");
    expect(screen.getByRole("button", { name: /send enquiry/i })).toBeEnabled();

    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement;
    expect(honeypot).toBeTruthy();
    expect(honeypot.tabIndex).toBe(-1);
    expect(honeypot.closest('[aria-hidden="true"]')).toBeTruthy();
  });

  it("shows an error summary, marks fields invalid and focuses the first invalid field on empty submit", async () => {
    render(<EnquiryForm programmes={programmes} destinations={destinations} />);
    fireEvent.click(screen.getByRole("button", { name: /send enquiry/i }));

    const alerts = await screen.findAllByRole("alert");
    const summary = alerts.find((el) => /please check the form/i.test(el.textContent ?? ""));
    expect(summary).toBeTruthy();
    expect(summary).toHaveTextContent(/2 field\(s\) need your attention/i);
    const name = screen.getByLabelText(/full name/i);
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute("aria-invalid", "true");
    expect(document.activeElement).toBe(name);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("validates a field on blur", async () => {
    render(<EnquiryForm programmes={programmes} destinations={destinations} />);
    const email = screen.getByLabelText(/email address/i);
    fireEvent.change(email, { target: { value: "nope" } });
    fireEvent.blur(email);
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    fireEvent.change(email, { target: { value: "ann@example.com" } });
    await waitFor(() => expect(email).not.toHaveAttribute("aria-invalid"));
  });

  it("posts JSON and shows the success panel", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true, id: "enq_42" }), { status: 201, headers: { "content-type": "application/json" } }));
    render(<EnquiryForm programmes={programmes} destinations={destinations} />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ann Lee" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "ann@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send enquiry/i }));

    const status = await screen.findByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/we have your enquiry/i);
    expect(status).toHaveTextContent(/an advisor will be in touch to confirm/i);
    expect(status).toHaveTextContent("enq_42");

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/enquiries");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ name: "Ann Lee", email: "ann@example.com", source: "enquiry-form", website: "" });
    expect(body.sessionId).toBeTruthy();
  });

  it("maps server 422 errors back onto fields", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(JSON.stringify({ ok: false, errors: { phone: ["Please enter a valid phone number"] } }), { status: 422 }));
    render(<EnquiryForm programmes={programmes} destinations={destinations} />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ann Lee" } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "ann@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send enquiry/i }));
    await waitFor(() => expect(screen.getByLabelText(/phone/i)).toHaveAttribute("aria-invalid", "true"));
    expect(document.activeElement).toBe(screen.getByLabelText(/phone/i));
  });
});
