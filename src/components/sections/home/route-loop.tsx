"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { LAND_MASK, LAND_MASK_STEP } from "./land-mask";

export type RoutePoint = { label: string; lat: number; lng: number };

/**
 * "Local start. Global future." as motion: one red route line leaves Vientiane for each destination in turn, over a
 * dotted world map. Drawn on a canvas from a single draw(t) with no state carried between frames, so it is
 * deterministic and the last frame equals the first (a seamless loop). The approach follows code-rendered motion
 * pieces in the Opus 5.5 video library (one line that never leaves the screen; one draw(t), no timers).
 * Runs only while visible; with reduced motion it shows one still frame with every route drawn.
 */

const VIEW = { lngMin: -25, lngMax: 182, latMin: -50, latMax: 66 }; // Europe → New Zealand
const SLOT = 2.6; // seconds per route
const PULSE = 1.3; // origin pulse period; divides SLOT so the loop has no seam
const RED = "#E5322D";
const RED_SOFT = "#FF8A85"; // brand-soft: red that reads on deep blue

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => {
  const v = clamp01(x);
  return v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2;
};

let landCache: [number, number][] | null = null;
/** Land cells as [lat, lng] centres. */
function landCells(): [number, number][] {
  if (landCache) return landCache;
  const bin = atob(LAND_MASK);
  const cols = 360 / LAND_MASK_STEP;
  const rows = 180 / LAND_MASK_STEP;
  const out: [number, number][] = [];
  for (let i = 0; i < cols * rows; i++) {
    if (bin.charCodeAt(i >> 3) & (1 << (i & 7))) {
      out.push([90 - (Math.floor(i / cols) + 0.5) * LAND_MASK_STEP, -180 + ((i % cols) + 0.5) * LAND_MASK_STEP]);
    }
  }
  return (landCache = out);
}

type Pt = { x: number; y: number };
type Route = { label: string; to: Pt; ctrl: Pt; edge: boolean };

function layout(w: number, h: number, origin: RoutePoint, destinations: RoutePoint[]) {
  const lngRange = VIEW.lngMax - VIEW.lngMin;
  const latRange = VIEW.latMax - VIEW.latMin;
  const s = Math.min(w / lngRange, h / latRange);
  const ox = (w - lngRange * s) / 2;
  const oy = (h - latRange * s) / 2;
  const project = (lat: number, lng: number): Pt => ({ x: ox + (lng - VIEW.lngMin) * s, y: oy + (VIEW.latMax - lat) * s });
  const from = project(origin.lat, origin.lng);
  const routes: Route[] = destinations.map((d) => {
    // Destinations west of the map (the Americas) end at its left edge, labelled with an arrow.
    const edge = d.lng < VIEW.lngMin;
    const to = edge ? { x: ox + 8, y: project(d.lat, VIEW.lngMin).y } : project(d.lat, d.lng);
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    return { label: (edge ? "← " : "") + d.label.toUpperCase(), to, ctrl: { x: mx, y: my - dist * 0.32 }, edge };
  });
  return { s, ox, oy, from, routes, project };
}

const bezier = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});

function strokeArc(ctx: CanvasRenderingContext2D, a: Pt, c: Pt, b: Pt, from: number, to: number) {
  const steps = 48;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const p = bezier(a, c, b, from + ((to - from) * i) / steps);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

export function RouteLoop({ origin, destinations, className }: { origin: RoutePoint; destinations: RoutePoint[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || destinations.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const land = document.createElement("canvas");
    const font = getComputedStyle(canvas).fontFamily;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let geo = layout(1, 1, origin, destinations);
    let raf = 0;
    let visible = false;
    let clock = 0; // seconds of animation shown so far (pauses while off screen)
    let last = 0;

    const label = (text: string, p: Pt, alpha: number, bold = false) => {
      if (alpha <= 0) return;
      ctx.font = `${bold ? 700 : 600} 10.5px ${font}`;
      if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "1.4px";
      const width = ctx.measureText(text).width;
      const right = p.x + 10 + width < w - 4; // flip to the left near the right edge
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";
      ctx.fillText(text, right ? p.x + 10 : p.x - 10 - width, p.y - 1);
      ctx.globalAlpha = 1;
    };

    /** The whole picture at time t (seconds). Pure: the same t always draws the same frame. */
    const draw = (t: number, still = false) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(land, 0, 0, w, h);
      const { from, routes } = geo;

      // Every route, faintly: the network is always there; the red line is the one being travelled.
      ctx.lineWidth = 1;
      ctx.strokeStyle = still ? "rgba(229,50,45,0.55)" : "rgba(255,255,255,0.09)";
      for (const r of routes) strokeArc(ctx, from, r.ctrl, r.to, 0, 1);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      for (const r of routes) {
        ctx.beginPath();
        ctx.arc(r.to.x, r.to.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!still) {
        const i = Math.floor(t / SLOT) % routes.length;
        const u = (t % SLOT) / SLOT;
        const r = routes[i];
        const head = ease(u / 0.42);
        const tail = ease((u - 0.56) / 0.34);
        if (head > tail) {
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.strokeStyle = RED;
          strokeArc(ctx, from, r.ctrl, r.to, tail, head);
          if (u < 0.44) {
            const p = bezier(from, r.ctrl, r.to, head);
            ctx.fillStyle = RED_SOFT;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // Arrival: a ring opens on the destination and its name appears, then both settle.
        const arrive = clamp01((u - 0.4) / 0.1) * (1 - clamp01((u - 0.86) / 0.12));
        if (arrive > 0) {
          const grow = ease((u - 0.4) / 0.3);
          ctx.strokeStyle = RED_SOFT;
          ctx.lineWidth = 1.25;
          ctx.globalAlpha = arrive * (1 - grow * 0.6);
          ctx.beginPath();
          ctx.arc(r.to.x, r.to.y, 3 + grow * 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = arrive;
          ctx.fillStyle = RED_SOFT;
          ctx.beginPath();
          ctx.arc(r.to.x, r.to.y, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          label(r.label, r.to, arrive);
        }
      }

      // Vientiane: always lit, with a pulse.
      const f = still ? 0.35 : (t % PULSE) / PULSE;
      ctx.strokeStyle = RED_SOFT;
      ctx.lineWidth = 1.25;
      ctx.globalAlpha = 0.7 * (1 - f);
      ctx.beginPath();
      ctx.arc(from.x, from.y, 4 + 12 * f, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = RED_SOFT;
      ctx.beginPath();
      ctx.arc(from.x, from.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      label("VIENTIANE", { x: from.x, y: from.y + 14 }, 1, true);
    };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(box.width));
      h = Math.max(1, Math.round(box.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      geo = layout(w, h, origin, destinations);
      // The dotted land is static: draw it once per size.
      land.width = w * dpr;
      land.height = h * dpr;
      const lctx = land.getContext("2d");
      if (lctx) {
        lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lctx.fillStyle = "rgba(255,255,255,0.16)";
        const dot = Math.max(0.8, geo.s * LAND_MASK_STEP * 0.2);
        for (const [lat, lng] of landCells()) {
          for (const L of [lng, lng + 360]) {
            if (L < VIEW.lngMin || L > VIEW.lngMax || lat < VIEW.latMin || lat > VIEW.latMax) continue;
            const p = geo.project(lat, L);
            lctx.beginPath();
            lctx.arc(p.x, p.y, dot, 0, Math.PI * 2);
            lctx.fill();
          }
        }
      }
      draw(clock % (SLOT * destinations.length), reduce.matches);
    };

    const tick = (now: number) => {
      if (last) clock += Math.min(0.1, (now - last) / 1000);
      last = now;
      draw(clock % (SLOT * destinations.length));
      raf = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(raf);
      last = 0;
      if (visible && !reduce.matches && document.visibilityState === "visible") raf = requestAnimationFrame(tick);
      else draw(clock % (SLOT * destinations.length), reduce.matches);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", update);
    reduce.addEventListener("change", update);
    resize();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      reduce.removeEventListener("change", update);
    };
  }, [origin, destinations]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={`Routes from ${origin.label} to ${destinations.map((d) => d.label).join(", ")}`}
      className={cn("block h-full w-full", className)}
    />
  );
}
