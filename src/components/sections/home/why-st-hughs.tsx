import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
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
      body: `${inst.ncukSince ? `${inst.ncukSince} ` : ""}SHV delivers the NCUK International Foundation Year and International Year One in Vientiane, with progression to NCUK University Partners.`,
      source: "NCUK",
      href: "/programmes",
    });
  }

  items.push({
    title: "English for Academic Purposes, built in",
    body: "Both NCUK programmes include English for Academic Purposes as a taught module. NCUK University Partners accept it in place of IELTS for progression, so language preparation is part of the course rather than a separate hurdle.",
    source: "NCUK",
    href: "/programmes",
  });

  items.push({
    title: "Start at home, then go",
    body: "The first year is taught in Vientiane. Students and families take on the cost and distance of moving abroad only after the foundation is complete and a university place is confirmed.",
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
    body: "Before anyone applies, an advisor checks qualifications against the published entry requirements and sets out a clear next step. It is guidance, not an admissions decision.",
    source: "Admissions",
    href: "/consultation",
  });

  return items.slice(0, 6);
}

/** Act III — Why St Hugh's. Evidence-led, sourced, no superlatives. */
export function WhyStHughs({ institution }: { institution: InstitutionSettings }) {
  const evidence = buildEvidence(institution);
  return (
    <section aria-labelledby="why-title" className="border-y border-line bg-bg-raised">
      <div className="container-x section-y grid grid-cols-12 gap-x-8 gap-y-12">
        <div className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <p className="eyebrow eyebrow-rule">Why St Hugh&rsquo;s</p>
              <h2 id="why-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
                New, and built to be checked.
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted text-pretty">
                St Hugh&rsquo;s College is a young institution. What it offers can be verified line by line — authorisation, partnership, programme structure —
                and every claim on this site carries its source.
              </p>
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
                  <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-fg-subtle tabular">{String(i + 1).padStart(2, "0")}</span>
                  <Badge tone="gold">{item.source}</Badge>
                </div>
                <h3 className="mt-4 text-[1.375rem] font-medium leading-snug text-fg text-balance md:text-[1.5rem]">{item.title}</h3>
                <p className="mt-3 max-w-prose text-[1.0625rem] leading-relaxed text-fg-muted">{item.body}</p>
                {item.href ? (
                  <span className="mt-4 inline-flex items-center gap-2 text-sm text-gold-soft">
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
