"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { SplitHeading } from "@/components/ui/split-heading";
import type { HomeCounts } from "./data";

export type JourneyDestination = { slug: string; country: string; isoCode: string; verified: boolean; routes: number };

/** Structural copy: the model in three steps. Facts come from published records (counts, destinations). */
const STEPS = [
  {
    n: "01",
    place: "Vientiane",
    when: "Year 1",
    title: "Year one, at home",
    body: "An NCUK foundation year or Year One, taught in English in Vientiane.",
    href: "/programmes",
    cta: "The programmes",
    image: { src: "/media/students/shv-classroom-teacher.jpg", alt: "A class in session at St Hugh's College Vientiane", position: "50% 40%" },
  },
  {
    n: "02",
    place: "Abroad",
    when: "Years 2 – 3",
    title: "Progress to a partner university",
    body: "Pass, and the qualification takes you to a degree abroad.",
    href: "/destinations",
    cta: "The destinations",
    image: { src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=75", alt: "", position: "50% 55%" },
  },
  {
    n: "03",
    place: "Anywhere",
    when: "After graduation",
    title: "Graduate, then go further",
    body: "An internationally recognised degree, and a career anywhere.",
    href: "/careers",
    cta: "Careers & employability",
    image: { src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=75", alt: "", position: "50% 45%" },
  },
] as const;

/**
 * Act II — How it works. A white band under the hero: a scroll-driven route line joins three steps
 * and the headline numbers count up.
 * Everything animates once, from the server-rendered final state, and is skipped under reduced motion.
 */
export function RouteJourney({ destinations, counts }: { destinations: JourneyDestination[]; counts: HomeCounts }) {
  const root = useRef<HTMLElement>(null);
  const stats = [
    { value: destinations.length, label: "Destinations" },
    { value: counts.universities, label: "Partner universities" },
    { value: counts.programmes, label: "Programmes in Vientiane" },
    { value: counts.routes, label: "Published routes" },
  ];

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(".rj-line-fill", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".rj-steps", start: "top 80%", end: "bottom 45%", scrub: 0.6 } });
      gsap.fromTo(".rj-vline-fill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".rj-steps", start: "top 80%", end: "bottom 45%", scrub: 0.6 } });
      gsap.from(".rj-step", { y: 36, opacity: 0, duration: 0.9, stagger: 0.16, ease: "power3.out", scrollTrigger: { trigger: ".rj-steps", start: "top 78%" } });
      // Each step lights up as the line reaches it, in order.
      gsap.utils.toArray<HTMLElement>(".rj-step").forEach((step, i) => {
        ScrollTrigger.create({ trigger: ".rj-steps", start: `top ${74 - i * 12}%`, onEnter: () => step.classList.add("is-reached"), onLeaveBack: () => step.classList.remove("is-reached") });
      });
            gsap.utils.toArray<HTMLElement>(".rj-count").forEach((node) => {
        const target = Number(node.dataset.count ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: node, start: "top 90%" },
          onUpdate: () => {
            node.textContent = String(Math.round(obj.v)).padStart(2, "0");
          },
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} aria-labelledby="journey-title" className="bg-bg text-fg relative overflow-hidden border-t border-line">
      <div className="container-x section-y relative">
        <div className="grid grid-cols-12 gap-x-8 gap-y-10 lg:items-end">
          <div className="col-span-12 lg:col-span-7">
            <p className="eyebrow eyebrow-rule">How it works</p>
            <SplitHeading id="journey-title" text="One year at home." accent="Then the world." accentClassName="italic text-blue" className="font-display mt-6 text-[clamp(2.5rem,5.4vw,5rem)] leading-[0.98] text-fg text-balance" />
          </div>
          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <Magnetic>
                <Button href="/consultation" arrow="right">
                  Book a free consultation
                </Button>
              </Magnetic>
              <Button href="/pathways" variant="secondary">
                See every route
              </Button>
            </div>
          </div>
        </div>

        {/* Three steps on one line */}
        <ol className="rj-steps relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8 lg:mt-24" aria-label="How the route works">
          <span aria-hidden className="absolute left-0 right-0 top-[7px] hidden h-px bg-line-strong md:block" />
          <span aria-hidden className="rj-line-fill absolute left-0 right-0 top-[7px] hidden h-px origin-left bg-route md:block" />
          <span aria-hidden className="absolute bottom-0 left-[7px] top-0 w-px bg-line-strong md:hidden" />
          <span aria-hidden className="rj-vline-fill absolute bottom-0 left-[7px] top-0 w-px origin-top bg-route md:hidden" />
          {STEPS.map((s) => (
            <li key={s.n} className="rj-step group relative pl-10 md:pl-0">
              <span aria-hidden className="rj-node absolute left-0 top-[1px] size-[15px] rounded-full border-2 border-route bg-bg transition-[background-color,transform] duration-[var(--dur)] group-hover:scale-125 group-hover:bg-route md:relative md:block" />
              <div className="md:mt-7">
                <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[var(--radius)] bg-bg-hover">
                  <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width:768px) 30vw, 90vw" className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.05]" style={{ objectPosition: s.image.position }} />
                </div>
                <p className="flex flex-wrap items-center gap-x-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-brand-soft">
                  <span className="tabular">{s.n}</span>
                  <span className="text-fg-subtle">·</span>
                  {s.place}
                  <span className="rj-when ml-auto rounded-full border border-line px-2 py-0.5 text-[0.625rem] text-fg-muted transition-colors duration-[var(--dur)]">{s.when}</span>
                </p>
                <h3 className="font-display mt-3 text-[clamp(1.75rem,2.6vw,2.5rem)] leading-[1.05] text-fg text-balance transition-colors duration-[var(--dur)] group-hover:text-blue">{s.title}</h3>
                <p className="mt-3 max-w-sm text-[1.0625rem] leading-relaxed text-fg-muted">{s.body}</p>
                <Link href={s.href} className="group mt-5 inline-flex items-center gap-2 text-[0.9375rem] text-fg">
                  {s.cta}
                  <span aria-hidden className="h-px w-6 bg-route transition-[width] duration-[var(--dur)] group-hover:w-10" />
                </Link>
              </div>
            </li>
          ))}
        </ol>

        {/* The numbers */}
        <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-line pt-10 md:grid-cols-4 lg:mt-20">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="rj-count font-display text-[clamp(3rem,5vw,4.5rem)] leading-none text-blue tabular" data-count={s.value}>
                {String(s.value).padStart(2, "0")}
              </dd>
              <dt className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
