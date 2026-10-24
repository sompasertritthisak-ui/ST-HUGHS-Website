import Image from "next/image";
import Link from "next/link";
import type { Media, Programme } from "@prisma/client";
import { ArrowRight, Check } from "lucide-react";
import { parseStringArray } from "@/lib/utils";
import { parseCostRows } from "@/components/programme/cost-at-a-glance";
import { Reveal } from "@/components/ui/reveal";
import { SplitHeading } from "@/components/ui/split-heading";
import { Button } from "@/components/ui/button";

type ProgrammeWithHero = Programme & { heroMedia?: Media | null };

/**
 * Programmes, at a glance (management feedback, Dennis): the BBA and the NCUK Foundation Year side by side as the two
 * flagship ways to start — equal weight — then every other option in one compact grid, including short courses.
 * Facts come from the programme records; anything not recorded says "ask an advisor", never a guess.
 */
const FLAGSHIPS = [
  {
    slug: "bba-entrepreneurship-innovation-gen-ai",
    badge: "Degree in Laos",
    name: "Bachelor of Business Administration",
    image: { src: "/media/students/Class_1.jpg", alt: "Students in class at St Hugh's College Vientiane" },
    strengths: ["Lower cost: all three years at home", "UK and French course content, taught in Lao", "English from A1 to B2 alongside your degree", "Three years instead of four", "Regular internships for real experience"],
  },
  {
    slug: "ncuk-international-foundation-year",
    badge: "Study abroad",
    name: "NCUK International Foundation Year",
    image: { src: "/media/students/shv-classroom-teacher.jpg", alt: "A lecturer teaching a small class at St Hugh's College Vientiane" },
    strengths: ["Official NCUK Study Centre in Laos", "Progress to 100+ universities worldwide", "Nine months in Vientiane before you go", "Academic English built in"],
  },
] as const;

const SHORT_COURSES = ["Bartending", "Barista skills", "Etiquette", "Speak like a TED talk"];

function firstYearCost(p: Programme) {
  const row = parseCostRows(parseStringArray(p.costRowsJson))[0];
  return row ? `${row.tuition} for ${row.period.toLowerCase().startsWith("each") ? "each level" : row.period}` : null;
}

export function ProgrammesAtAGlance({ programmes }: { programmes: ProgrammeWithHero[] }) {
  const bySlug = new Map(programmes.map((p) => [p.slug, p]));
  const flagships = FLAGSHIPS.map((f) => ({ ...f, p: bySlug.get(f.slug) })).filter((f) => f.p);
  const others = programmes.filter((p) => !FLAGSHIPS.some((f) => f.slug === p.slug));

  return (
    <section aria-labelledby="programmes-title" className="bg-bg text-fg border-t border-line">
      <div className="container-x section-y">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-8">
            <p className="eyebrow eyebrow-rule">Our programmes</p>
            <SplitHeading id="programmes-title" text="Two ways to start." accent="Many ways to go further." accentClassName="text-blue" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance" />
          </Reveal>
          <Reveal className="lg:col-span-4 lg:text-right" delay={80}>
            <Button href="/programmes" variant="ghost" arrow="right">
              Compare all programmes
            </Button>
          </Reveal>
        </div>

        {/* The two flagships, side by side with equal weight */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:mt-14 lg:gap-6">
          {flagships.map(({ p, badge, name, image, strengths, slug }, i) => {
            const programme = p!;
            const cost = firstYearCost(programme);
            const facts = [
              { k: "Duration", v: programme.durationLabel?.split(/[(;]/)[0].trim() },
              { k: "Language", v: programme.teachingLanguage },
              { k: "Where", v: programme.studyLocation.split(/[(;—]/)[0].trim() },
              { k: "Cost", v: cost ?? "Ask an advisor" },
            ].filter((x) => x.v);
            return (
              <Reveal key={slug} delay={i * 80} className="flex">
                <article className="flex w-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-raised shadow-[0_20px_60px_-30px_rgb(11_22_64/0.35)]">
                  <div className="relative aspect-[16/9] overflow-hidden bg-bg-hover">
                    <Image src={image.src} alt={image.alt} fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover" />
                    <span className="absolute left-4 top-4 rounded-full bg-blue px-3 py-1.5 text-[0.8125rem] font-semibold text-white shadow-sm">{badge}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-7">
                    <h3 className="font-display text-[clamp(1.625rem,2.6vw,2.25rem)] leading-[1.08] text-fg text-balance">{name}</h3>
                    <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-fg-muted max-sm:hidden">{programme.summary.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() ?? programme.summary}</p>
                    <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-line py-4">
                      {facts.map((f) => (
                        <div key={f.k} className="min-w-0">
                          <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-subtle">{f.k}</dt>
                          <dd className="mt-0.5 text-[0.9375rem] font-medium leading-snug text-fg">{f.v}</dd>
                        </div>
                      ))}
                    </dl>
                    <ul className="mt-5 grid gap-2">
                      {strengths.map((s) => (
                        <li key={s} className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-fg">
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-route" strokeWidth={2.25} />
                          {s}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex flex-wrap gap-3 pt-6">
                      <Button href={`/programmes/${programme.slug}`} arrow="right" className="max-sm:w-full">
                        Explore the programme
                      </Button>
                      <Button href={`/consultation?programme=${programme.slug}`} variant="secondary" className="max-sm:hidden">
                        Talk to an advisor
                      </Button>
                      <Button href={`/consultation?programme=${programme.slug}`} variant="ghost" arrow="right" className="sm:hidden">
                        Talk to an advisor
                      </Button>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Every other option, at a glance */}
        <h3 className="mt-14 font-mono text-[0.75rem] font-bold uppercase tracking-[0.12em] text-fg-subtle lg:mt-20">More ways to study</h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((p) => {
            const cost = firstYearCost(p);
            return (
              <li key={p.slug}>
                <Link href={`/programmes/${p.slug}`} className="group flex h-full items-center gap-3 rounded-[var(--radius)] border border-line px-4 py-3 transition-colors hover:border-route hover:bg-bg-hover sm:flex-col sm:items-stretch sm:p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-brand-soft">{p.awardingBody ?? "St Hugh's College Vientiane"}</span>
                    <span className="mt-1 block font-display text-[1.1875rem] leading-[1.12] text-fg text-balance sm:mt-1.5 sm:text-[1.3125rem]">{p.shortTitle ?? p.title}</span>
                    <span className="mt-1 block text-[0.8125rem] leading-snug text-fg-muted sm:mt-2">{[p.durationLabel?.split(/[(;]/)[0].trim(), cost].filter(Boolean).join(" · ")}</span>
                  </span>
                  <ArrowRight aria-hidden className="size-4 shrink-0 text-route transition-transform group-hover:translate-x-1 sm:mt-auto sm:self-end" strokeWidth={2} />
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/enquire?topic=short-courses" className="group flex h-full flex-col rounded-[var(--radius)] border border-dashed border-line-strong px-4 py-3 sm:p-4 transition-colors hover:border-route hover:bg-bg-hover">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-brand-soft">Short courses</span>
              <span className="mt-1.5 font-display text-[1.3125rem] leading-[1.12] text-fg">Skills for work and life</span>
              <span className="mt-2 text-[0.8125rem] leading-snug text-fg-muted">{SHORT_COURSES.join(" · ")}</span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-fg">
                Ask about dates <ArrowRight aria-hidden className="size-4 text-route transition-transform group-hover:translate-x-1" strokeWidth={2} />
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
