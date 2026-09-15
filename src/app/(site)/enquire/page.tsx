import type { Metadata } from "next";
import { getContactSettings, getDestinations, getProgrammes } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";
import { PageHero } from "@/components/sections/page-hero";
import { Button } from "@/components/ui/button";
import { EnquiryForm, WhatsAppLink, whatsappHref, firstParam, type LeadSearchParams } from "@/components/forms";

export const metadata: Metadata = pageMetadata({
  title: t("enquire.title"),
  description: "Contact St Hugh's College Vientiane. Students, parents, university partners and employers can send an enquiry and the right person will reply.",
  path: "/enquire",
});

export default async function EnquirePage({ searchParams }: { searchParams: LeadSearchParams }) {
  const sp = await searchParams;
  const [programmes, destinations, contact] = await Promise.all([getProgrammes(), getDestinations(), getContactSettings()]);
  const wa = whatsappHref(contact);

  const defaults = {
    programmeSlug: firstParam(sp.programme),
    destinationSlug: firstParam(sp.destination),
    audience: firstParam(sp.audience),
    type: firstParam(sp.type),
  };

  const audiences = [t("enquire.aside.students"), t("enquire.aside.partners"), t("enquire.aside.employers")];

  return (
    <>
      <PageHero eyebrow={t("enquire.eyebrow")} title={t("enquire.title")} lede={t("enquire.lede")} />

      <section className="container-x pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <EnquiryForm
              programmes={programmes.map((p) => ({ slug: p.slug, title: p.title, shortTitle: p.shortTitle }))}
              destinations={destinations.map((d) => ({ slug: d.slug, country: d.country }))}
              defaults={defaults}
              whatsappHref={wa}
            />
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow eyebrow-rule mb-6">{t("enquire.aside.title")}</p>
              <ul className="space-y-4 border-l border-line pl-5">
                {audiences.map((a) => (
                  <li key={a} className="text-sm leading-relaxed text-fg-muted">
                    {a}
                  </li>
                ))}
              </ul>

              <div className="surface-raised mt-10 rounded-[var(--radius-lg)] p-6">
                <p className="text-fg">{t("enquire.aside.consultation")}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button href="/consultation" variant="secondary" arrow="right">
                    {t("enquire.aside.consultation.cta")}
                  </Button>
                  <WhatsAppLink href={wa} />
                </div>
              </div>

              {contact.phones.length ? (
                <p className="mt-6 text-sm text-fg-subtle">
                  {t("consultation.contact")}{" "}
                  {contact.phones.map((p, i) => (
                    <span key={p}>
                      {i > 0 ? " · " : ""}
                      <a href={`tel:${p.replace(/\s+/g, "")}`} className="text-fg-muted hover:text-fg">
                        {p}
                      </a>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
