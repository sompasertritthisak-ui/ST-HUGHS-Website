import type { Metadata } from "next";
import { Compass, ListChecks, Route, Phone, Clock, MapPin } from "lucide-react";
import { getContactSettings, getDestinations, getMessagingSettings, getPathwayBySlug, getProgrammes } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationForm, WhatsAppLink, whatsappHref, firstParam, type LeadSearchParams } from "@/components/forms";

export const metadata: Metadata = pageMetadata({
  title: t("consultation.title"),
  description: "Book a free consultation with a St Hugh's College Vientiane advisor: programme guidance, an entry-requirement checklist and a clear next-step plan.",
  path: "/consultation",
});

const BENEFITS = [
  { Icon: Compass, title: t("consultation.benefit.guidance.title"), body: t("consultation.benefit.guidance.body") },
  { Icon: ListChecks, title: t("consultation.benefit.checklist.title"), body: t("consultation.benefit.checklist.body") },
  { Icon: Route, title: t("consultation.benefit.plan.title"), body: t("consultation.benefit.plan.body") },
];

export default async function ConsultationPage({ searchParams }: { searchParams: LeadSearchParams }) {
  const sp = await searchParams;
  const pathwaySlug = firstParam(sp.pathway);
  const [programmes, destinations, contact, messaging, pathway] = await Promise.all([
    getProgrammes(),
    getDestinations(),
    getContactSettings(),
    getMessagingSettings(),
    pathwaySlug ? getPathwayBySlug(pathwaySlug) : null,
  ]);
  const wa = whatsappHref(contact);

  const defaults = {
    programmeSlug: firstParam(sp.programme) ?? pathway?.programme?.slug,
    destinationSlug: firstParam(sp.destination) ?? pathway?.destination?.slug,
    pathwaySlug: pathway?.slug,
    audience: firstParam(sp.audience),
    mode: firstParam(sp.mode),
  };

  return (
    <>
      <PageHero eyebrow={t("consultation.eyebrow")} title={t("consultation.title")} lede={t("consultation.lede")} />

      <section className="container-x pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ConsultationForm
              programmes={programmes.map((p) => ({ slug: p.slug, title: p.title, shortTitle: p.shortTitle }))}
              destinations={destinations.map((d) => ({ slug: d.slug, country: d.country }))}
              defaults={defaults}
              context={pathway ? { label: t("forms.context.pathway"), title: pathway.title } : null}
              whatsappHref={wa}
            />
            <p className="mt-8 text-sm text-fg-subtle">{messaging.guidanceDisclaimer}</p>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow eyebrow-rule mb-6">{t("consultation.whatYouGet")}</p>
              <ul className="space-y-6">
                {BENEFITS.map(({ Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <Icon aria-hidden className="mt-1 size-5 shrink-0 text-brand" strokeWidth={1.5} />
                    <div>
                      <h2 className="text-base font-medium text-fg">{title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="surface-raised mt-10 rounded-[var(--radius-lg)] p-6">
                <p className="eyebrow eyebrow-rule mb-4">{t("consultation.contact")}</p>
                <dl className="space-y-3 text-sm">
                  {contact.phones.length ? (
                    <div className="flex gap-3">
                      <dt className="sr-only">Phone</dt>
                      <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-soft" strokeWidth={1.5} />
                      <dd className="flex flex-col gap-1">
                        {contact.phones.map((p) => (
                          <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="text-fg hover:text-brand-soft">
                            {p}
                          </a>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                  {contact.officeHours.length ? (
                    <div className="flex gap-3">
                      <dt className="sr-only">{t("consultation.contact.hours")}</dt>
                      <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-soft" strokeWidth={1.5} />
                      <dd className="text-fg-muted">{contact.officeHours.join(" · ")}</dd>
                    </div>
                  ) : null}
                  {contact.addressLines.length ? (
                    <div className="flex gap-3">
                      <dt className="sr-only">Address</dt>
                      <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-soft" strokeWidth={1.5} />
                      <dd className="text-fg-muted">{contact.addressLines.join(", ")}</dd>
                    </div>
                  ) : null}
                </dl>
                {wa ? (
                  <div className="mt-5">
                    <WhatsAppLink href={wa} />
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
