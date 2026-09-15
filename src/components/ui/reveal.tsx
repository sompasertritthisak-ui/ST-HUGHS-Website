"use client";

import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tag = "div" | "section" | "article" | "li" | "ul" | "ol" | "span" | "figure" | "header" | "footer" | "aside";

/**
 * Scroll reveal via IntersectionObserver. Adds `.is-visible` once. Pure CSS
 * transition (see globals.css) so it is free on the main thread and respects
 * prefers-reduced-motion automatically.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; as?: Tag }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add("is-visible");
    const inView = () => el.getBoundingClientRect().top < window.innerHeight * 1.1;
    // Already on screen at mount (first paint, hash navigation, restored scroll): show at once.
    if (inView()) {
      show();
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }
    // Safety valve: if an observer callback is ever missed, a passive scroll check reveals the element.
    const onScroll = () => {
      if (inView()) {
        show();
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return createElement(
    as,
    { ref, className: cn("reveal", className), style: { "--reveal-delay": `${delay}ms` } as CSSProperties },
    children,
  );
}
