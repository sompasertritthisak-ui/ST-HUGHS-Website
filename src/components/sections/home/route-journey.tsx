"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CtaTrio } from "@/components/ui/cta-trio";
import { SplitHeading } from "@/components/ui/split-heading";
import type { HomeCounts } from "./data";

export type JourneyDestination = { slug: string; country: string; isoCode: string; verified: boolean; routes: number };

/** Two equal ways to start (management feedback: show the BBA side by side with NCUK). Copy for the NCUK track is
 *  management's wording; BBA facts come from the BBA programme record. */
const TRACKS = {
  ncuk: {
    tab: "Study abroad",
    tabSub: "NCUK Foundation Year",
    lede: "Begin your international education journey at St Hugh’s College Vientiane through the NCUK International Foundation Year, designed to prepare you for progression to universities worldwide.",
    strengths: ["Official NCUK Study Centre in Laos", "100+ universities worldwide", "One year at home before you go", "Academic English built in"],
    steps: [
      { n: "01", place: "Vientiane", when: "Year 1", title: "Build your foundation in Laos", body: "Complete your NCUK International Foundation Year in Vientiane, developing the academic knowledge and English language skills needed for university study.", href: "/programmes/ncuk-international-foundation-year", cta: "Explore the programme", image: { src: "/media/students/shv-classroom-teacher.jpg", alt: "A class in session at St Hugh's College Vientiane", position: "50% 40%" } },
      { n: "02", place: "International", when: "University years", title: "Progress to a university abroad", body: "Upon meeting the entry requirements, progress to an NCUK partner university and continue your chosen degree overseas.", href: "/universities", cta: "Explore universities", image: { src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=75", alt: "", position: "50% 55%" } },
      { n: "03", place: "Your future", when: "After graduation", title: "Graduate with global opportunities", body: "Earn your university degree and develop the knowledge, skills and international experience to pursue opportunities around the world.", href: "/careers", cta: "Explore future opportunities", image: { src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=75", alt: "", position: "50% 45%" } },
    ],
  },
  bba: {
    tab: "Degree in Laos",
    tabSub: "St Hugh’s BBA",
    lede: "Earn a recognised bachelor’s degree without leaving Vientiane: three years taught in Lao, with English and real internships built into every year.",
    strengths: ["Lower cost: all three years at home", "UK and French course content, taught in Lao", "English from A1 to B2 alongside your degree", "Three years instead of four", "Regular internships for real experience"],
    steps: [
      { n: "01", place: "Vientiane", when: "Year 1", title: "Diploma, taught in Lao", body: "Management, economics, accounting and marketing, with English from A1 and a 6-week internship.", href: "/programmes/bba-entrepreneurship-innovation-gen-ai", cta: "Explore the BBA", image: { src: "/media/students/Class_1.jpg", alt: "Students in class at St Hugh's College Vientiane", position: "50% 50%" } },
      { n: "02", place: "Vientiane", when: "Year 2", title: "Associate degree", body: "Finance, law and tax, operations, strategy and generative AI, with an 8-week venture residency.", href: "/programmes/bba-entrepreneurship-innovation-gen-ai#structure", cta: "See what you study", image: { src: "/media/students/shv-classroom-teacher.jpg", alt: "A lecturer teaching a small class at St Hugh's College Vientiane", position: "50% 40%" } },
      { n: "03", place: "Laos and beyond", when: "Year 3 + internship", title: "Your bachelor’s degree", body: "A top-up year and a 24-week internship with report defence, graduating with English at B2.", href: "/programmes/bba-entrepreneurship-innovation-gen-ai#after", cta: "Where graduates go", image: { src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=75", alt: "", position: "50% 45%" } },
    ],
  },
} as const;
type TrackKey = keyof typeof TRACKS;

/**
 * Act II — How it works. A white band under the hero: a scroll-driven route line joins three steps
 * and the headline numbers count up.
 * Everything animates once, from the server-rendered final state, and is skipped under reduced motion.
 */
export function RouteJourney({ destinations, counts }: { destinations: JourneyDestination[]; counts: HomeCounts }) {
  const root = useRef<HTMLElement>(null);
  const [track, setTrack] = useState<TrackKey>("ncuk");
  const t = TRACKS[track];
  const stats: { value: number; label: string; display?: string }[] = [
    { value: 100, display: "100+", label: "Universities through NCUK" },
    { value: counts.universities, label: "Partner universities on our routes" },
    { value: destinations.length, label: "Destinations" },
    { value: counts.programmes, label: "Programmes in Vientiane" },
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
            <p className="eyebrow eyebrow-rule">Your pathway to the world</p>
            <SplitHeading id="journey-title" text="Start in Laos." accent="Go beyond borders." accentClassName="italic text-blue" className="font-display mt-6 text-[clamp(2.5rem,5.4vw,5rem)] leading-[0.98] text-fg text-balance" />
            <p className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-fg-muted text-pretty md:text-lg">{t.lede}</p>
          </div>
          {/* Desktop only: on phones the hero's buttons are one screen above and the enquiry bar is always on screen. */}
          <div className="col-span-12 max-lg:hidden lg:col-span-5 lg:col-start-8">
            <CtaTrio compact className="lg:justify-end" />
          </div>
        </div>

        {/* Two equal ways to start, side by side */}
        <div role="tablist" aria-label="Choose how to start" className="mt-10 grid grid-cols-2 gap-2 rounded-[var(--radius-lg)] border border-line bg-bg-raised p-1.5 sm:max-w-xl">
          {(Object.keys(TRACKS) as TrackKey[]).map((k) => {
            const on = k === track;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                id={`rj-tab-${k}`}
                aria-selected={on}
                aria-controls="rj-panel"
                onClick={() => setTrack(k)}
                className={`flex min-h-14 flex-col items-start justify-center rounded-[var(--radius)] px-4 py-2 text-left transition-colors duration-[var(--dur)] ${on ? "bg-blue text-white shadow-sm" : "text-fg hover:bg-bg-hover"}`}
              >
                <span className="text-[1rem] font-semibold leading-tight">{TRACKS[k].tab}</span>
                <span className={`text-[0.8125rem] leading-tight ${on ? "text-white/80" : "text-fg-muted"}`}>{TRACKS[k].tabSub}</span>
              </button>
            );
          })}
        </div>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Why choose this route">
          {t.strengths.map((x) => (
            <li key={x} className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-[0.875rem] font-medium text-fg">
              <span aria-hidden className="size-1.5 rounded-full bg-route" />
              {x}
            </li>
          ))}
        </ul>

        {/* Three steps on one line */}
        <ol id="rj-panel" role="tabpanel" aria-labelledby={`rj-tab-${track}`} className="rj-steps relative mt-12 grid gap-12 md:grid-cols-3 md:gap-8 lg:mt-16" aria-label="How the route works">
          <span aria-hidden className="absolute left-0 right-0 top-[7px] hidden h-px bg-line-strong md:block" />
          <span aria-hidden className="rj-line-fill absolute left-0 right-0 top-[7px] hidden h-px origin-left bg-route md:block" />
          <span aria-hidden className="absolute bottom-0 left-[7px] top-0 w-px bg-line-strong md:hidden" />
          <span aria-hidden className="rj-vline-fill absolute bottom-0 left-[7px] top-0 w-px origin-top bg-route md:hidden" />
          {t.steps.map((s) => (
            <li key={track + s.n} className="rj-step group relative pl-10 md:pl-0">
              <span aria-hidden className="rj-node absolute left-0 top-[1px] size-[15px] rounded-full border-2 border-route bg-bg transition-[background-color,transform] duration-[var(--dur)] group-hover:scale-125 group-hover:bg-route md:relative md:block" />
              <div className="md:mt-7">
                <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[var(--radius)] bg-bg-hover">
                  <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width:768px) 30vw, 90vw" className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.05]" style={{ objectPosition: s.image.position }} />
                </div>
                <p className="flex flex-wrap items-center gap-x-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-brand-soft">
                  <span className="tabular">{s.n}</span>
                  <span className="text-fg-subtle">·</span>
                  {s.place}
                  <span className="rj-when ml-auto rounded-full border border-line px-2 py-0.5 text-[0.6875rem] text-fg-muted transition-colors duration-[var(--dur)]">{s.when}</span>
                </p>
                <h3 className="font-display mt-3 text-[clamp(1.75rem,2.6vw,2.5rem)] leading-[1.05] text-fg text-balance transition-colors duration-[var(--dur)] group-hover:text-blue">{s.title}</h3>
                <p className="mt-3 max-w-sm text-[1.0625rem] leading-relaxed text-fg-muted">{s.body}</p>
                <Link href={s.href} className="group mt-5 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-fg">
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
              <dd className={`font-display text-[clamp(3rem,5vw,4.5rem)] leading-none text-blue tabular ${s.display ? "" : "rj-count"}`} data-count={s.value}>
                {s.display ?? String(s.value).padStart(2, "0")}
              </dd>
              <dt className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
