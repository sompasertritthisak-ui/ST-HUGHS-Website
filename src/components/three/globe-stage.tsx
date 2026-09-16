"use client";

import { useRouter } from "next/navigation";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { GlobeFallback } from "./globe-fallback";
import type { GlobeDestination } from "./geo";
import type { GlobeTier } from "./globe";
import { cn } from "@/lib/utils";

/**
 * Client-only, code-split. `React.lazy` rather than `next/dynamic` so the
 * surrounding <Suspense> fallback (the SVG map) really shows while the
 * three.js chunk downloads — next/dynamic wraps its own null fallback.
 * It is only ever rendered after mount (mode === "webgl"), never on the server.
 */
const Globe = lazy(() => import("./globe").then((m) => ({ default: m.Globe })));

type Mode = "pending" | "webgl" | "fallback";

/**
 * Gating — the SVG map is used ONLY when: the user prefers reduced motion, the
 * browser asks for data saving, no WebGL context can be created, or the
 * viewport is narrower than 768px. Device memory / core count never gate;
 * they pick the quality tier below. A normal desktop always gets WebGL.
 */
function canRunWebGL(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (nav.connection?.saveData) return false;
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
 * Quality tier — "high": all 5,914 land dots, dpr ≤ 1.5, 260 stars.
 * "low": every second dot, dpr 1, 120 stars. Chosen from device memory,
 * core count and a phone-like pixel ratio; never used to withhold WebGL.
 */
function pickTier(): GlobeTier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return "low";
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4) return "low";
  if (window.devicePixelRatio >= 3) return "low";
  return "high";
}

/**
 * @param webgl  Set false to force the static map (e.g. the small-screen band
 *               that is also mounted, hidden, on large screens — it must never
 *               create a second WebGL context). Defaults to true: desktop gets 3D.
 */
export function GlobeStage({ destinations, className, webgl = true }: { destinations: GlobeDestination[]; className?: string; webgl?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("pending");
  const [tier, setTier] = useState<GlobeTier>("high");
  const [inView, setInView] = useState(true);
  const reduced = useReducedMotion();
  // Scroll-linked styles are attached after mount so server and client markup match exactly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const ok = webgl && canRunWebGL();
    if (ok) setTier(pickTier());
    setMode(ok ? "webgl" : "fallback");
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

  const onSelect = useCallback((slug: string) => router.push(`/destinations/${slug}`), [router]);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={cn(mode === "webgl" ? "pointer-events-auto" : "pointer-events-none", className)}
      style={mounted && !reduced ? { scale, opacity, y } : undefined}
    >
      {mode === "webgl" ? (
        <Suspense fallback={<GlobeFallback destinations={destinations} />}>
          <Globe destinations={destinations} active={inView} scroll={progress} tier={tier} onSelect={onSelect} />
        </Suspense>
      ) : (
        <GlobeFallback destinations={destinations} />
      )}
    </motion.div>
  );
}
