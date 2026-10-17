"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

/**
 * Scroll parallax for an image inside a clipped tile: the child drifts vertically as the tile
 * crosses the viewport, so photographs read with depth rather than sitting flat. Wrap it in an
 * `overflow-hidden` tile and give this element negative insets so the edges never show.
 * Skipped under reduced motion.
 */
export function Parallax({ children, speed = 0.25, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { yPercent: -speed * 32 }, { yPercent: speed * 32, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, [speed]);
  return (
    <div ref={ref} className={cn("absolute inset-[-14%] will-change-transform", className)}>
      {children}
    </div>
  );
}
