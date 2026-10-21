"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCROLL_LOCK_EVENT } from "./scroll-lock";

/**
 * Inertial smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger scenes stay in
 * sync. Off for touch devices (native momentum is better there) and under reduced motion.
 * Elements with `data-lenis-prevent` keep native wheel behaviour (horizontal strips, code).
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Overlays (menu drawer, search) pause the page scroller while open.
    const onLock = (e: Event) => ((e as CustomEvent<boolean>).detail ? lenis.stop() : lenis.start());
    window.addEventListener(SCROLL_LOCK_EVENT, onLock);
    return () => {
      window.removeEventListener(SCROLL_LOCK_EVENT, onLock);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
