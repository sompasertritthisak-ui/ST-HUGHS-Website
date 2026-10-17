"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Job enquiry for people who want to work at St Hugh's. Posts to the same enquiries endpoint as the
 * public forms (audience OTHER, source "work-with-us"), so it lands in the CMS enquiry queue with
 * the role and CV link in the message. No file upload: a link to a CV or LinkedIn profile is asked for.
 */
const ROLES = ["Teaching — NCUK programmes", "English language teaching", "Admissions and marketing", "Student services", "Operations and administration", "Other"] as const;

type Values = { name: string; email: string; phone: string; role: string; link: string; message: string; consent: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function JobEnquiryForm({ className }: { className?: string }) {
  const [v, setV] = useState<Values>({ name: "", email: "", phone: "", role: ROLES[0], link: "", message: "", consent: false });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const validate = () => {
    const e: typeof errors = {};
    if (v.name.trim().length < 2) e.name = "Please enter your full name";
    if (!EMAIL_RE.test(v.email.trim())) e.email = "Please enter a valid email address";
    if (v.link && !/^https?:\/\//i.test(v.link.trim())) e.link = "Please paste a full link starting with https://";
    if (v.message.trim().length < 20) e.message = "Tell us a little about yourself (at least 20 characters)";
    if (!v.consent) e.consent = "Please confirm so we may contact you about this enquiry";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    const message = [`[Job enquiry] Area: ${v.role}`, v.link ? `CV / profile: ${v.link.trim()}` : null, "", v.message.trim()].filter((x) => x !== null).join("\n");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ENQUIRY", name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() || undefined, audience: "OTHER", message, consentMarketing: false, source: "work-with-us" }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  const field = "w-full rounded-[var(--radius-sm)] border border-line bg-bg px-4 py-3 text-[1rem] text-fg placeholder:text-fg-subtle focus:border-blue focus:outline-none";
  const label = "mb-1.5 block text-sm font-semibold text-fg";
  const err = (k: keyof Values) => (errors[k] ? <p className="mt-1 text-sm text-brand-deep">{errors[k]}</p> : null);

  if (status === "success") {
    return (
      <div className={cn("rounded-[var(--radius-lg)] border border-line bg-bg p-8", className)} role="status">
        <p className="eyebrow eyebrow-rule">Received</p>
        <h3 className="font-display mt-4 text-[2rem] leading-tight text-fg">Thank you. We have your enquiry.</h3>
        <p className="mt-3 max-w-prose text-fg-muted">The team reads every application personally and replies by email, usually within five working days. If a role matches, we will be in touch to arrange a conversation.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={cn("grid gap-5", className)}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="job-name" className={label}>Full name</label>
          <input id="job-name" className={field} value={v.name} onChange={set("name")} autoComplete="name" required />
          {err("name")}
        </div>
        <div>
          <label htmlFor="job-email" className={label}>Email</label>
          <input id="job-email" type="email" className={field} value={v.email} onChange={set("email")} autoComplete="email" required />
          {err("email")}
        </div>
        <div>
          <label htmlFor="job-phone" className={label}>Phone <span className="font-normal text-fg-subtle">(optional)</span></label>
          <input id="job-phone" type="tel" className={field} value={v.phone} onChange={set("phone")} autoComplete="tel" placeholder="+856 20 …" />
        </div>
        <div>
          <label htmlFor="job-role" className={label}>Area of work</label>
          <select id="job-role" className={field} value={v.role} onChange={set("role")}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="job-link" className={label}>Link to your CV or LinkedIn profile <span className="font-normal text-fg-subtle">(optional)</span></label>
        <input id="job-link" type="url" className={field} value={v.link} onChange={set("link")} placeholder="https://" />
        {err("link")}
      </div>
      <div>
        <label htmlFor="job-message" className={label}>About you</label>
        <textarea id="job-message" rows={5} className={field} value={v.message} onChange={set("message")} placeholder="Your experience, qualifications and what you would bring to St Hugh's." />
        {err("message")}
      </div>
      <label className="flex items-start gap-3 text-sm text-fg-muted">
        <input type="checkbox" className="mt-1 size-4 accent-[var(--color-brand)]" checked={v.consent} onChange={set("consent")} />
        <span>I agree that St Hugh&rsquo;s College Vientiane may keep these details and contact me about this enquiry.</span>
      </label>
      {err("consent")}
      {status === "error" ? <p className="text-sm text-brand-deep">Something went wrong sending your enquiry. Please try again, or email admissions@sthughs.edu.la.</p> : null}
      <div>
        <button type="submit" disabled={status === "submitting"} className="inline-flex h-12 items-center justify-center rounded-[var(--radius-sm)] bg-brand px-6 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-60">
          {status === "submitting" ? "Sending…" : "Send job enquiry"}
        </button>
      </div>
    </form>
  );
}
