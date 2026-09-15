"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { GlobeFallback } from "./globe-fallback";
import type { GlobeDestination } from "./geo";
import { cn } from "@/lib/utils";

const Globe = dynamic(() => import("./globe").then((m) => m.Globe), { ssr: false, loading: () => null });

type Mode = "pending" | "webgl" | "fallback";

/**
 * Device adaptation (from the brief): the WebGL globe only renders on capable,
 * motion-tolerant devices with room to show it. Everything else — and the
 * server-rendered first frame — gets the static premium map.
 */
function canRunWebGL(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4) return false;
  if (window.innerWidth < 768) return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return false;
  } catch {
    return false;
  }
  return true;
}

/**
 * @param webgl  Set false to force the static map (e.g. the small-screen band
 *               that is also mounted, hidden, on large screens — it must never
 *               create a second WebGL context).
 */
export function GlobeStage({ destinations, className, webgl = true }: { destinations: GlobeDestination[]; className?: string; webgl?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("pending");
  const [inView, setInView] = useState(true);
  const reduced = useReducedMotion();
  // Scroll-linked styles are attached after mount so server and client markup match exactly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setMode(webgl && canRunWebGL() ? "webgl" : "fallback");
  }, [webgl]);

  // Pause the render loop the moment the hero leaves the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.isIntersecting);
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll scrub: as the hero leaves, the globe recedes and turns slightly.
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (v) => {
    if (typeof window === "undefined") return 0;
    const range = Math.max(1, window.innerHeight * 0.9);
    return Math.min(1, Math.max(0, v / range));
  });
  const scale = useTransform(progress, [0, 1], [1, 0.78]);
  const opacity = useTransform(progress, [0, 0.7, 1], [1, 0.55, 0]);
  const y = useTransform(progress, [0, 1], [0, 90]);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={mounted && !reduced ? { scale, opacity, y } : undefined}
    >
      {mode === "webgl" ? (
        <Suspense fallback={<GlobeFallback destinations={destinations} />}>
          <Globe destinations={destinations} active={inView} scroll={progress} />
        </Suspense>
      ) : (
        <GlobeFallback destinations={destinations} />
      )}
    </motion.div>
  );
}
