import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import { getContactSettings, getFaqs } from "@/lib/content";
import { getInstitutionSettings } from "@/lib/content-pages";
import { pageMetadata, educationalOrganizationJsonLd, faqPageJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { PAGE_IMAGES } from "@/components/cinematic/placeholders";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { Section, FactsTable, NextSteps } from "@/components/pages";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { FacebookIcon, LinkedinIcon, YoutubeIcon, InstagramIcon } from "@/components/site/social-icons";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Contact St Hugh's College Vientiane: address in Nonsavanh Village, phone, email, office hours, map and how to book a free consultation.",
  path: "/contact",
});

export default async function ContactPage() {
  const [contact, institution, faqs] = await Promise.all([getContactSettings(), getInstitutionSettings(), getFaqs({ category: "CAMPUS" })]);
  const socials = [
    { href: contact.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: contact.social.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    { href: contact.social.youtube, label: "YouTube", Icon: YoutubeIcon },
    { href: contact.social.instagram, label: "Instagram", Icon: InstagramIcon },
  ].filter((s) => s.href);
  const whatsapp = contact.whatsapp?.trim();

  return (
    <>
      <PageHero media={PAGE_IMAGES["contact"]}
        eyebrow="Contact"
        title={<>Start with a <span className="italic text-brand-soft">conversation.</span></>}
        lede="Two ways in: book a free consultation with an advisor, or send an enquiry and the admissions team will respond. The details below are the published contact points for the college."
        aside={
          <div className="flex flex-col gap-3 border-t border-line pt-6">
            <Button href="/consultation" arrow="right">
              Book a free consultation
            </Button>
            <Button href="/enquire" variant="secondary">
              Send an enquiry
            </Button>
          </div>
        }
      />

      <Section eyebrow="Reach us" title={contact.institutionName}>
        <FactsTable
          columns={1}
          rows={[
            {
              label: "Address",
              value: contact.addressLines.length ? (
                <address className="not-italic">
                  {contact.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
              ) : null,
            },
            {
              label: "Phone",
              value: contact.phones.length ? (
                <ul>
                  {contact.phones.map((p) => (
                    <li key={p}>
                      <a href={`tel:${p.replace(/\s+/g, "")}`} className="hover:text-brand-soft">
                        {p}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null,
            },
            {
              label: "Email",
              value: contact.emails.length ? (
                <ul>
                  {contact.emails.map((e) => (
                    <li key={e}>
                      <a href={`mailto:${e}`} className="hover:text-brand-soft">
                        {e}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null,
              pending: "Confirmed by the admissions team — use the enquiry form meanwhile",
            },
            { label: "WhatsApp", value: whatsapp ? <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-soft">{whatsapp}</a> : null, pending: "Published when confirmed" },
            { label: "Office hours", value: contact.officeHours.length ? contact.officeHours.join("; ") : null },
            { label: "Admissions contact", value: contact.admissionsContact || null },
            { label: "Press contact", value: contact.pressContact || null, pending: "Published when confirmed" },
          ]}
        />
        {socials.length ? (
          <ul className="mt-8 flex gap-2" aria-label="Social links">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
                  <Icon className="size-4" strokeWidth={1.5} />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      <Section eyebrow="Find us" title="Campus map" lede={`${contact.addressLines.slice(0, 2).join(", ") || "Vientiane"}. Book a tour and an advisor will meet you at reception.`} layout="full">
        {contact.mapEmbedUrl ? (
          <div className="relative aspect-[21/9] overflow-hidden rounded-[var(--radius)] border border-line bg-bg-raised">
            <iframe src={contact.mapEmbedUrl} title="Campus map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full" />
          </div>
        ) : (
          // No verified map embed yet: an address card that hands off to Google Maps by name and address
          // (never a guessed pin). Staff can paste a Google Maps embed URL in CMS → Settings → Contact.
          <div className="theme-dark relative overflow-hidden rounded-[var(--radius)] bg-midnight p-6 text-white sm:p-10">
            <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-route" />
            <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
              <span aria-hidden className="flex size-14 items-center justify-center rounded-full bg-white/10">
                <MapPin className="size-7 text-white" strokeWidth={1.5} />
              </span>
              <div>
                <p className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight">{contact.institutionName}</p>
                <address className="mt-3 not-italic text-[1.0625rem] leading-relaxed text-white/80">
                  {contact.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([contact.institutionName, ...contact.addressLines].join(", "))}`} arrow="external">
                    Get directions
                  </Button>
                  <Button href="/enquire?type=visit" variant="secondary" className="border-white/40 text-white hover:border-white hover:bg-white/10">
                    Book a tour
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section eyebrow="Next" title="Two ways to begin">
        <NextSteps
          items={[
            { label: "Book a free consultation", description: "In person, online, by phone or WhatsApp — an advisor checks your options", href: "/consultation" },
            { label: "Send an enquiry", description: "Ask a question; the admissions team responds", href: "/enquire" },
            { label: "Book a tour", description: "Walk the campus with an advisor", href: "/enquire?type=visit" },
          ]}
        />
      </Section>

      {faqs.length ? (
        <Section eyebrow="FAQ" title="Getting here">
          <Accordion items={faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          <JsonLd data={faqPageJsonLd(faqs)} />
        </Section>
      ) : null}

      <JsonLd data={educationalOrganizationJsonLd(contact, { established: institution.established })} />
      <ConsultationBand title="Prefer to talk it through?" body="A free consultation takes the guesswork out of the route. Book a time that suits you." primaryHref="/consultation" primaryLabel="Book a free consultation" secondaryHref="/enquire" secondaryLabel="Send an enquiry" />
    </>
  );
}
