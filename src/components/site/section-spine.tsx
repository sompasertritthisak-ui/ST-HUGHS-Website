"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type SpineStop = { id: string; label: string };

/**
 * The red line as wayfinding: a thin vertical spine in the left gutter (≥ xl) with one node per
 * act of the homepage. Fills with scroll progress, highlights the act in view, and jumps on click.
 * Each stop id is the id of the act's heading; the section it belongs to is derived from it.
 */
export function SectionSpine({ stops }: { stops: SpineStop[] }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sections = stops.map((s) => document.getElementById(s.id)?.closest("section") ?? null);
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      setVisible(window.scrollY > window.innerHeight * 0.6 && max - window.scrollY > 200);
      const probe = window.innerHeight * 0.4;
      let current = 0;
      sections.forEach((sec, i) => {
        if (sec && sec.getBoundingClientRect().top <= probe) current = i;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [stops]);

  const jump = (id: string) => {
    const sec = document.getElementById(id)?.closest("section");
    sec?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Page sections"
      className={cn(
        "fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 mix-blend-difference transition-opacity duration-[var(--dur)] xl:block",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="relative flex flex-col items-center gap-3 py-2">
        <span aria-hidden className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-white/15" />
        <span aria-hidden className="absolute left-1/2 top-2 w-px -translate-x-1/2 origin-top bg-white" style={{ height: "calc(100% - 1rem)", transform: `translateX(-50%) scaleY(${progress})` }} />
        {stops.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => jump(s.id)}
            aria-label={`Go to ${s.label}`}
            aria-current={i === active ? "true" : undefined}
            className="group relative flex size-4 items-center justify-center"
          >
            <span
              className={cn(
                "size-1.5 rounded-full transition-[transform,background-color] duration-[var(--dur)]",
                i === active ? "scale-[1.7] bg-white shadow-[0_0_10px_rgb(255_255_255/0.8)]" : "bg-white/40 group-hover:bg-white",
              )}
            />
            <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] bg-white px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-black opacity-0 transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 group-focus-visible:opacity-100">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
