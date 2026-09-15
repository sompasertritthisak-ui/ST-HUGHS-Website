import type { ContactSettings } from "@/lib/content";

/**
 * Server-side helpers shared by the /consultation and /enquire pages.
 * `WHATSAPP_NUMBER` env wins over the CMS contact setting so the deployment
 * can switch numbers without a content release.
 */
export function whatsappHref(contact: Pick<ContactSettings, "whatsapp">, env: string | undefined = process.env.WHATSAPP_NUMBER): string | null {
  const raw = (env || contact.whatsapp || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const digits = raw.replace(/[^\d]/g, "");
  return digits.length >= 6 ? `https://wa.me/${digits}` : null;
}

export type LeadSearchParams = Promise<Record<string, string | string[] | undefined>>;

export function firstParam(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s ? s.slice(0, 160) : undefined;
}
