import type { Metadata } from "next";
import { getContactSettings, getFaqs } from "@/lib/content";
import { getInstitutionSettings } from "@/lib/content-pages";
import { pageMetadata, educationalOrganizationJsonLd, faqPageJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { JsonLd } from "@/components/site/json-ld";
import { Section, FactsTable, PendingLine, NextSteps } from "@/components/pages";
import { Plate } from "@/components/ui/plate";
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
      <PageHero
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

      <Section eyebrow="Find us" title="Campus map" lede="Nonsavanh Village, Saysettha District. Book a visit and an advisor will meet you at reception." layout="full">
        {contact.mapEmbedUrl ? (
          <div className="relative aspect-[21/9] overflow-hidden rounded-[var(--radius)] border border-line bg-bg-raised">
            <iframe src={contact.mapEmbedUrl} title="Campus map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Plate media={null} slot="Campus map" aspect="21/9" sizes="(min-width:1320px) 880px, 100vw" />
            </div>
            <div className="lg:col-span-4">
              {typeof contact.mapLat === "number" && typeof contact.mapLng === "number" ? (
                <dl className="border-t border-line pt-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
                  <dt className="text-fg-subtle">Coordinates</dt>
                  <dd className="mt-2 normal-case tracking-normal text-fg tabular">
                    {contact.mapLat.toFixed(4)}, {contact.mapLng.toFixed(4)}
                  </dd>
                  <dd className="mt-3 normal-case tracking-normal">
                    <a href={`https://www.openstreetmap.org/?mlat=${contact.mapLat}&mlon=${contact.mapLng}#map=16/${contact.mapLat}/${contact.mapLng}`} target="_blank" rel="noopener noreferrer" className="text-brand-soft underline underline-offset-4">
                      Open in OpenStreetMap ↗
                    </a>
                  </dd>
                </dl>
              ) : (
                <PendingLine>Map published when confirmed.</PendingLine>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section eyebrow="Next" title="Two ways to begin">
        <NextSteps
          items={[
            { label: "Book a free consultation", description: "In person, online, by phone or WhatsApp — an advisor checks your options", href: "/consultation" },
            { label: "Send an enquiry", description: "Ask a question; the admissions team responds", href: "/enquire" },
            { label: "Book a campus visit", description: "Walk the campus with an advisor", href: "/consultation?type=visit" },
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
