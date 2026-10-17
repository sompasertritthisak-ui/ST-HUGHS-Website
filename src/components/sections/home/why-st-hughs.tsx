import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SplitHeading } from "@/components/ui/split-heading";
import type { InstitutionSettings } from "./data";

type Evidence = { title: string; body: string; source: string; href?: string };

/** Builds the evidence list from verified institution facts only. Nothing here is invented. */
function buildEvidence(inst: InstitutionSettings): Evidence[] {
  const items: Evidence[] = [];

  if (inst.authorisation) {
    items.push({
      title: "Authorised in Laos",
      body: inst.authorisation,
      source: "Lao MoES",
      href: "/about",
    });
  }

  if (inst.ncukStudyCentre) {
    items.push({
      title: "An NCUK Study Centre",
      body: `${inst.ncukSince ? `${inst.ncukSince} ` : ""}SHV delivers NCUK programmes in Vientiane with progression to NCUK University Partners.`,
      source: "NCUK",
      href: "/programmes",
    });
  }

  items.push({
    title: "English for Academic Purposes, built in",
    body: "Taught inside both NCUK programmes and accepted by NCUK University Partners in place of IELTS.",
    source: "NCUK",
    href: "/programmes",
  });

  items.push({
    title: "Start at home, then go",
    body: "The first year is taught in Vientiane; the move abroad comes once a university place is confirmed.",
    source: "Vientiane",
    href: "/pathways",
  });

  if (inst.sisterInstitution) {
    items.push({
      title: "Roots in Vientiane",
      body: `Sister institution: ${inst.sisterInstitution}. St Hugh's was established in ${inst.established} and builds on that experience of international education in Laos.`,
      source: "PBIS",
      href: "/about",
    });
  }

  items.push({
    title: "A free consultation, first",
    body: "An advisor checks your qualifications against the entry requirements before you apply.",
    source: "Admissions",
    href: "/consultation",
  });

  return items.slice(0, 6);
}

/** Act III — Why St Hugh's. Evidence-led, sourced, no superlatives. */
export function WhyStHughs({ institution, limit = 6 }: { institution: InstitutionSettings; limit?: number }) {
  const evidence = buildEvidence(institution).slice(0, limit);
  return (
    <section aria-labelledby="why-title" className="theme-light bg-bg text-fg border-y border-line">
      <div className="container-x section-y grid grid-cols-12 gap-x-8 gap-y-12">
        <div className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <p className="eyebrow eyebrow-rule">Why St Hugh&rsquo;s</p>
              <SplitHeading id="why-title" text="New, and built" accent="to be checked." accentClassName="text-blue" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance" />
              <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted text-pretty">Every claim on this site carries its source.</p>
              <div className="mt-8">
                <Button href="/why-st-hughs" variant="ghost" arrow="right">
                  Read the full case
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        <ol className="col-span-12 lg:col-span-7 lg:col-start-6" aria-label="Evidence">
          {evidence.map((item, i) => {
            const body = (
              <>
                <div className="flex items-baseline justify-between gap-6">
                  <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-brand-soft tabular">{String(i + 1).padStart(2, "0")}</span>
                  <Badge tone="gold">{item.source}</Badge>
                </div>
                <h3 className="mt-4 text-[1.375rem] font-medium leading-snug text-fg text-balance md:text-[1.5rem]">{item.title}</h3>
                <p className="mt-3 max-w-prose text-[1.0625rem] leading-relaxed text-fg-muted">{item.body}</p>
                {item.href ? (
                  <span className="mt-4 inline-flex items-center gap-2 text-sm text-brand-soft">
                    More
                    <ArrowRight aria-hidden className="size-4 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-1" strokeWidth={1.5} />
                  </span>
                ) : null}
              </>
            );
            return (
              <Reveal as="li" key={item.title} delay={i * 40} className="border-t border-line last:border-b">
                {item.href ? (
                  <Link href={item.href} className="group block py-8 transition-colors hover:bg-bg-hover/30 md:py-10">
                    {body}
                  </Link>
                ) : (
                  <div className="py-8 md:py-10">{body}</div>
                )}
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
