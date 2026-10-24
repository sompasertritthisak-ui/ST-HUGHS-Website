import Image from "next/image";
import Link from "next/link";
import { Award } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SplitHeading } from "@/components/ui/split-heading";
import { Button } from "@/components/ui/button";
import { ScholarshipCta, SCHOLARSHIP_CHECK_HREF } from "@/components/ui/scholarship-cta";

/**
 * Scholarships (management feedback, Dennis: "a dedicated space and a large image that catches students' attention").
 * Every figure is from a named source; where none is published (the BBA) the card says to ask, never a number.
 *  NCUK: ncuk.ac.uk/ncuk-awards-and-university-scholarships (checked 24 Oct 2026) · BUV and ESDES: SHV 2026–27 brochures.
 */
export const SCHOLARSHIPS = [
  { who: "NCUK University Partners", what: "£500 – £10,000", detail: "Exclusive scholarships at NCUK University Partners for students on NCUK programmes, such as the Foundation Year.", source: "NCUK", href: "/programmes/ncuk-international-foundation-year" },
  { who: "British University Vietnam", what: "100%, 50% or 25%", detail: "BUV scholarships advertised for the 2026 intake of the 2+2 Hospitality Management route.", source: "SHV 2026–27 brochure", href: "/programmes/bachelor-international-hospitality-management" },
  { who: "ESDES Business School, Lyon", what: "Up to 30%", detail: "Merit scholarships on the first ESDES year, plus a 10% early-bird discount when the year is paid early.", source: "SHV 2026–27 brochure", href: "/programmes/bachelor-international-business-esdes" },
  { who: "St Hugh’s BBA", what: "Ask us", detail: "Ask an advisor about scholarships, discounts and payment plans for the BBA taught in Lao.", source: null, href: "/enquire?topic=scholarships" },
] as const;

export function Scholarships({ headingLevel = "h2", compact = true }: { headingLevel?: "h1" | "h2"; compact?: boolean }) {
  // compact: on phones the home page shows the headline figures only; the full page always shows every detail.
  const phoneHide = compact ? "max-sm:hidden" : "";
  return (
    <section aria-labelledby="scholarships-title" className="theme-dark relative overflow-hidden bg-midnight text-white">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-route" />
      <div className="grid lg:grid-cols-12">
        {/* The large image */}
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:col-span-5 lg:aspect-auto lg:min-h-[44rem]">
          <Image
            src="https://images.unsplash.com/photo-1627556704302-624286467c65?auto=format&fit=crop&w=1400&q=75"
            alt="A graduate raising a mortarboard in front of a university building"
            fill
            sizes="(min-width:1024px) 42vw, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 38%" }}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-midnight" />
          <Link href={SCHOLARSHIP_CHECK_HREF} className="absolute bottom-5 left-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 py-2 text-[0.875rem] font-semibold text-white shadow-lg transition-colors hover:bg-brand-deep lg:bottom-8 lg:left-8">
            <Award aria-hidden className="size-4" strokeWidth={2} /> Scholarships available · Check yours
          </Link>
        </div>

        <div className="container-x py-12 lg:col-span-7 lg:py-20 lg:pl-12">
          <Reveal>
            <p className="eyebrow eyebrow-rule text-brand-soft">Scholarships</p>
            <SplitHeading
              as={headingLevel}
              id="scholarships-title"
              text="Go further, for"
              accent="less."
              accentClassName="italic text-brand-soft"
              className="font-display mt-5 text-[clamp(2.5rem,5.4vw,4.75rem)] leading-[0.98] text-white text-balance"
            />
            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/80 text-pretty">
              Scholarships and discounts can reduce the cost of your degree. An advisor checks which ones you could apply for, at no cost.
            </p>
            <ScholarshipCta className="mt-7" />
          </Reveal>
          <ul className={`mt-8 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
            {SCHOLARSHIPS.map((s, i) => (
              <Reveal key={s.who} as="li" delay={i * 60}>
                <Link href={SCHOLARSHIP_CHECK_HREF} aria-label={`Check eligibility: ${s.who}, ${s.what}`} className="group flex h-full flex-col rounded-[var(--radius)] border border-white/15 bg-white/[0.06] p-4 sm:p-5 transition-colors hover:border-brand-soft hover:bg-white/[0.1]">
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-white/65">{s.who}</span>
                  <span className="mt-2 font-display text-[clamp(1.375rem,2.6vw,2.25rem)] leading-tight text-white">{s.what}</span>
                  <span className={`mt-3 text-[0.875rem] leading-relaxed text-white/80 ${phoneHide}`}>{s.detail}</span>
                  {s.source ? <span className={`mt-auto pt-3 text-[0.75rem] text-white/50 ${phoneHide}`}>Source: {s.source}</span> : null}
                  <span className={`inline-flex items-center gap-1.5 pt-3 text-[0.875rem] font-semibold text-brand-soft group-hover:text-white ${s.source ? "" : "mt-auto"}`}>
                    Check eligibility <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-start gap-x-6 gap-y-3">
            <ScholarshipCta note={null} />
            <Button href="/consultation" variant="ghost" arrow="right" className="text-white hover:text-brand-soft max-sm:justify-center max-sm:w-full">
              Or talk to an advisor
            </Button>
          </div>
          <p className="mt-5 max-w-xl text-[0.8125rem] leading-relaxed text-white/55">
            Scholarships are awarded by each university under its own criteria and may change. Amounts and eligibility for your intake are confirmed by the admissions team.
          </p>
        </div>
      </div>
    </section>
  );
}
