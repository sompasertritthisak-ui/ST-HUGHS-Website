"use client";

import { motion, useReducedMotion } from "motion/react";
import { MAP_H, MAP_VIEWBOX, MAP_W, project, routePath, type GeoPoint, type Point } from "./model";
import type { ExplorerDestination } from "./data";
import { cn } from "@/lib/utils";

export type MapRoute = {
  id: string;
  points: GeoPoint[];
  /** Emphasised (the resolved route). */
  active: boolean;
};

/**
 * Stylised equirectangular route map. Pure 2D SVG, aria-hidden — the parent
 * renders a visually-hidden text summary. Graticule every 30°, Vientiane as
 * the lit origin, destination nodes placed by projection, gold routes drawn on.
 */
export function RouteMap({
  origin,
  destinations,
  routes,
  reachable,
  selected,
  className,
}: {
  origin: (GeoPoint & { label: string }) | null;
  destinations: ExplorerDestination[];
  routes: MapRoute[];
  /** Destination slugs still reachable under the current selection. */
  reachable: Set<string>;
  /** The chosen destination slug, if any. */
  selected?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const o: Point | null = origin ? project(origin.lat, origin.lng) : null;
  const meridians = Array.from({ length: 13 }, (_, i) => -180 + i * 30);
  const parallels = Array.from({ length: 7 }, (_, i) => -90 + i * 30);
  const { x, y, w, h } = MAP_VIEWBOX;

  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox={`${x} ${y} ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn("block h-full w-full", className)}
    >
      <defs>
        <radialGradient id="shv-origin-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--route)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--route)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="shv-map-clip">
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>

      <g clipPath="url(#shv-map-clip)">
        {/* Graticule */}
        <g stroke="var(--fg)" strokeOpacity="0.07" strokeWidth="0.75" fill="none">
          {meridians.map((lng) => {
            const px = project(0, lng).x;
            return <line key={`m${lng}`} x1={px} y1={0} x2={px} y2={MAP_H} />;
          })}
          {parallels.map((lat) => {
            const py = project(lat, 0).y;
            return <line key={`p${lat}`} x1={0} y1={py} x2={MAP_W} y2={py} strokeOpacity={lat === 0 ? 0.14 : 0.07} />;
          })}
        </g>

        {/* Origin glow */}
        {o ? <circle cx={o.x} cy={o.y} r={70} fill="url(#shv-origin-glow)" /> : null}

        {/* Routes */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {routes.map((r) => {
            const d = routePath(r.points.map((p) => project(p.lat, p.lng)));
            if (!d) return null;
            return (
              <motion.path
                key={r.id}
                d={d}
                stroke="var(--route)"
                strokeWidth={r.active ? 1.6 : 1}
                strokeOpacity={r.active ? 0.95 : 0.35}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduced ? { duration: 0 } : { pathLength: { duration: 1.1, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.3 } }}
              />
            );
          })}
        </g>

        {/* Destination nodes */}
        {destinations.map((d) => {
          const p = project(d.lat, d.lng);
          const isSelected = d.slug === selected;
          const isReachable = reachable.has(d.slug);
          const labelRight = p.x < MAP_W * 0.55;
          return (
            <g key={d.slug} className="transition-opacity duration-[var(--dur)]" opacity={isReachable || isSelected ? 1 : 0.3}>
              {isSelected ? (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={11}
                  fill="none"
                  stroke="var(--route)"
                  strokeOpacity="0.7"
                  strokeWidth="0.75"
                  className={reduced ? undefined : "motion-safe:animate-[pulse-ring_1.8s_var(--ease-out)_infinite]"}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              ) : null}
              <circle cx={p.x} cy={p.y} r={isSelected ? 4 : isReachable ? 3.2 : 2.4} fill={isReachable || isSelected ? "var(--route)" : "var(--fg-subtle)"} />
              <text
                x={labelRight ? p.x + 9 : p.x - 9}
                y={p.y + 3.5}
                textAnchor={labelRight ? "start" : "end"}
                fontSize={9.5}
                letterSpacing="1.2"
                fontFamily="var(--font-mono)"
                fill={isSelected ? "var(--color-gold-soft)" : "var(--fg-muted)"}
              >
                {d.isoCode}
              </text>
            </g>
          );
        })}

        {/* Origin node */}
        {o ? (
          <g>
            <circle
              cx={o.x}
              cy={o.y}
              r={13}
              fill="none"
              stroke="var(--route)"
              strokeOpacity="0.8"
              strokeWidth="0.75"
              className={reduced ? undefined : "motion-safe:animate-[pulse-ring_2.4s_var(--ease-out)_infinite]"}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
            <circle cx={o.x} cy={o.y} r={4.5} fill="var(--route)" />
            <circle cx={o.x} cy={o.y} r={2} fill="var(--color-ivory)" />
            <text x={o.x} y={o.y + 22} textAnchor="middle" fontSize={10} letterSpacing="1.6" fontFamily="var(--font-mono)" fill="var(--color-gold-soft)">
              {origin!.label.toUpperCase()}
            </text>
          </g>
        ) : null}
      </g>
    </svg>
  );
}
