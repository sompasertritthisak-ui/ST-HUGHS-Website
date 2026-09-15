import type { Metadata } from "next";
import Image from "next/image";
import { getUniversities, getPartners } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PARTNER_TYPE_LABELS, type PartnerType } from "@/lib/enums";
import { PageHero } from "@/components/sections/page-hero";
import { ConsultationBand } from "@/components/sections/consultation-band";
import { UniversityCard } from "@/components/cards/university-card";
import { Section, PendingLine } from "@/components/pages";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { VerificationBadge } from "@/components/ui/verification-badge";

export const metadata: Metadata = pageMetadata({
  title: "Universities",
  description: "The NCUK university network and the named institutions referenced in SHV pathways — with partnership type, transfer point and verification status for each.",
  path: "/universities",
});

export default async function UniversitiesPage() {
  const [universities, partners] = await Promise.all([getUniversities(), getPartners()]);
  const network = universities.filter((u) => u.partnershipType === "NCUK_NETWORK");
  const named = universities.filter((u) => u.partnershipType !== "NCUK_NETWORK");

  return (
    <>
      <PageHero
        eyebrow="Universities"
        title={
          <>
            The institutions at the <span className="italic text-gold-soft">end of the line.</span>
          </>
        }
        lede="Two kinds of destination appear here: the NCUK university network that receives International Foundation Year and International Year One students, and the named institutions referenced in SHV's own pathway routes. Each carries its partnership type and a verification status — trust is shown, not claimed."
        aside={
          <dl className="grid grid-cols-2 gap-6 border-t border-line pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
            <div>
              <dt className="text-fg-subtle">Listed institutions</dt>
              <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{universities.length}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Verified</dt>
              <dd className="font-display mt-2 text-[2.5rem] normal-case tracking-normal text-fg tabular">{universities.filter((u) => u.verificationStatus === "VERIFIED").length}</dd>
            </div>
          </dl>
        }
      />

      <Section eyebrow="Network" title="NCUK University Partners" lede="Students completing an NCUK qualification at SHV apply to the NCUK network through NCUK's placement support. Progression depends on the published requirements of the chosen course." layout="full">
        {network.length ? (
          <div className="grid gap-6 lg:grid-cols-12">
            {network.map((u, i) => (
              <Reveal key={u.id} delay={i * 40} className="lg:col-span-7">
                <UniversityCard university={u} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Network details are published as confirmed" />
        )}
      </Section>

      <Section eyebrow="Named institutions" title="Institutions in SHV pathway routes" lede="Universities referenced in current SHV materials for bachelor routes. Where a partnership is still being formalised the card says so." layout="full">
        {named.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {named.map((u, i) => (
              <Reveal key={u.id} delay={i * 40}>
                <UniversityCard university={u} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Named partner institutions are published as agreements are confirmed" />
        )}
        {named.some((u) => u.verificationStatus !== "VERIFIED") ? (
          <p className="mt-8 flex flex-wrap items-center gap-3 text-sm text-fg-subtle">
            <VerificationBadge status="PENDING" /> Verification pending: details are being confirmed with the partner before publication.
          </p>
        ) : null}
      </Section>

      <Section eyebrow="Global academic network" title="Awarding bodies and education partners" lede="Each name links to the organisation's own website. Nothing here is decorative — every entry is a published, verified or clearly pending relationship." layout="full">
        {partners.length ? (
          <ul className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => {
              const logo = p.logo && p.logo.usageStatus === "APPROVED" ? p.logo : null;
              const body = (
                <>
                  <div className="flex h-12 items-center">
                    {logo ? <Image src={logo.url} alt={logo.alt || p.name} width={logo.width ?? 160} height={logo.height ?? 48} className="max-h-10 w-auto object-contain" /> : <span className="font-display text-[1.5rem] leading-tight text-fg">{p.name}</span>}
                  </div>
                  <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-gold-soft">{PARTNER_TYPE_LABELS[p.type as PartnerType] ?? p.type}</p>
                  {p.description ? <p className="mt-3 text-sm leading-relaxed text-fg-muted">{p.description}</p> : null}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    {p.website ? <span className="text-gold-soft">{p.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗</span> : <PendingLine>Website published when confirmed</PendingLine>}
                    {p.verificationStatus !== "VERIFIED" ? <VerificationBadge status={p.verificationStatus} /> : null}
                  </div>
                </>
              );
              return (
                <li key={p.id} className="bg-bg">
                  {p.website ? (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" data-analytics="outbound_partner_click" className="group block h-full p-6 transition-colors hover:bg-bg-raised">
                      {body}
                    </a>
                  ) : (
                    <div className="h-full p-6">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Partners are published as they are approved" />
        )}
      </Section>

      <section className="container-x py-6">
        <Button href="/destinations" variant="ghost" arrow="right">
          See the destinations these institutions belong to
        </Button>
      </section>

      <ConsultationBand title="Where could you study?" body="View the pathways that lead to each institution, or send an enquiry and the admissions team will respond with the routes open to you." primaryHref="/pathways" primaryLabel="View pathways" secondaryHref="/enquire" secondaryLabel="Enquire" />
    </>
  );
}
