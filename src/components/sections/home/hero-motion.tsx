"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll-linked depth for the hero: the copy drifts up a little faster than the
 * page and the globe settles back and fades, so leaving the hero feels like
 * lifting off rather than scrolling past. Skipped under reduced motion.
 */
export function HeroMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = document.getElementById("hero-title")?.closest("section");
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const copy = section.querySelector<HTMLElement>("[data-hero-copy]");
      const globe = section.querySelector<HTMLElement>("[data-hero-globe]");
      const common = { trigger: section, start: "top top", end: "bottom top", scrub: 0.8 } as const;
      if (copy) gsap.to(copy, { y: -90, opacity: 0.25, ease: "none", scrollTrigger: common });
      if (globe) gsap.to(globe, { y: 60, scale: 0.94, opacity: 0.35, ease: "none", scrollTrigger: common });
    }, section);
    return () => ctx.revert();
  }, []);
  return null;
}
