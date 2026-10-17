"use client";

import { createElement, useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Tag = "h1" | "h2" | "h3" | "p" | "span";

/**
 * A heading whose words rise into view, one after another, the first time it scrolls on screen.
 * Server-rendered in its final state; pure CSS transitions (see `.split` in globals.css) so it is
 * free on the main thread and respects prefers-reduced-motion. `accent` renders in italic red.
 */
export function SplitHeading({
  as = "h2",
  text,
  accent,
  id,
  className,
  accentClassName = "italic text-brand-soft",
}: {
  as?: Tag;
  text: string;
  accent?: string;
  id?: string;
  className?: string;
  accentClassName?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add("is-visible");
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95 || typeof IntersectionObserver === "undefined") {
      show();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(/\s+/).filter(Boolean);
  const accents = accent ? accent.split(/\s+/).filter(Boolean) : [];
  const all = [...words.map((w) => ({ w, accent: false })), ...accents.map((w) => ({ w, accent: true }))];

  return createElement(
    as,
    { ref, id, className: cn("split", className) },
    all.map((item, i) => (
      <span key={`${item.w}-${i}`}>
        <span className="split-mask">
          <span className={cn("split-word", item.accent && accentClassName)} style={{ "--i": i } as CSSProperties}>
            {item.w}
          </span>
        </span>
        {i < all.length - 1 ? " " : null}
      </span>
    )),
  );
}
