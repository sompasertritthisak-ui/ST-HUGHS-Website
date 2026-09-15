import { ORIGIN, angularDistance, project, type GlobeDestination } from "./geo";
import { cn } from "@/lib/utils";

/**
 * Static premium fallback for the hero globe: a stylised equirectangular map
 * with a faint graticule, the origin node and curved routes that draw on with
 * stroke-dasharray. Server-safe (no hooks) so it can also be the SSR frame
 * before the WebGL scene mounts. Same palette, same story.
 */

const W = 720;
const H = 360;
/** Equirectangular projection re-centred on 40°E so the origin (Vientiane) and every destination sit inside the frame. */
const CENTRE_LNG = 40;
const px = (lat: number, lng: number): [number, number] => project(lat, ((((lng - CENTRE_LNG + 180) % 360) + 360) % 360) - 180, W, H);

export function GlobeFallback({ destinations, className, animate = true }: { destinations: GlobeDestination[]; className?: string; animate?: boolean }) {
  const [ox, oy] = px(ORIGIN.lat, ORIGIN.lng);
  const parallels = [-60, -30, 0, 30, 60];
  const meridians = Array.from({ length: 11 }, (_, i) => -150 + i * 30);

  return (
    <div className={cn("relative h-full w-full", className)} aria-hidden>
      <style>{`
        @keyframes shv-gf-draw { to { stroke-dashoffset: 0; } }
        @keyframes shv-gf-in { to { opacity: 1; } }
        @keyframes shv-gf-pulse { 0% { transform: scale(.6); opacity: .9; } 100% { transform: scale(2.4); opacity: 0; } }
        .shv-gf-arc { stroke-dasharray: 1; stroke-dashoffset: 1; }
        .shv-gf-dot { opacity: 0; }
        .shv-gf-animate .shv-gf-arc { animation: shv-gf-draw 1200ms var(--ease-out) forwards; }
        .shv-gf-animate .shv-gf-dot { animation: shv-gf-in 400ms var(--ease-out) forwards; }
        .shv-gf-static .shv-gf-arc { stroke-dashoffset: 0; }
        .shv-gf-static .shv-gf-dot { opacity: 1; }
        .shv-gf-pulse { transform-box: fill-box; transform-origin: center; animation: shv-gf-pulse 2.2s var(--ease-out) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .shv-gf-arc { stroke-dashoffset: 0 !important; animation: none !important; }
          .shv-gf-dot { opacity: 1 !important; animation: none !important; }
          .shv-gf-pulse { animation: none !important; opacity: .4; }
        }
      `}</style>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={cn("h-full w-full", animate ? "shv-gf-animate" : "shv-gf-static")}
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        <defs>
          <radialGradient id="shv-gf-vignette" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="var(--color-navy)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-midnight)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="url(#shv-gf-vignette)" />

        {/* Graticule */}
        <g stroke="var(--fg-muted)" strokeOpacity="0.14" strokeWidth="0.6" fill="none">
          <rect x="0.5" y="0.5" width={W - 1} height={H - 1} strokeOpacity="0.2" />
          {parallels.map((lat) => {
            const y = px(lat, 0)[1];
            return <line key={`p${lat}`} x1="0" y1={y} x2={W} y2={y} strokeDasharray={lat === 0 ? undefined : "2 6"} />;
          })}
          {meridians.map((lng) => {
            const x = px(0, lng)[0];
            return <line key={`m${lng}`} x1={x} y1="0" x2={x} y2={H} strokeDasharray="2 6" />;
          })}
        </g>

        {/* Routes */}
        <g fill="none" strokeLinecap="round">
          {destinations.map((d, i) => {
            const [dx, dy] = px(d.lat, d.lng);
            const dist = angularDistance(ORIGIN.lat, ORIGIN.lng, d.lat, d.lng);
            const mx = (ox + dx) / 2;
            const my = Math.min(oy, dy) - 24 - dist * 34;
            return (
              <path
                key={d.slug}
                className="shv-gf-arc"
                pathLength={1}
                d={`M ${ox} ${oy} Q ${mx} ${my} ${dx} ${dy}`}
                stroke="var(--color-gold)"
                strokeOpacity={d.verified ? 0.7 : 0.38}
                strokeWidth="0.9"
                style={{ animationDelay: `${500 + i * 140}ms` }}
              />
            );
          })}
        </g>

        {/* Destination nodes + ISO labels */}
        <g>
          {destinations.map((d, i) => {
            const [dx, dy] = px(d.lat, d.lng);
            const labelRight = dx < W - 60;
            return (
              <g key={d.slug} className="shv-gf-dot" style={{ animationDelay: `${1600 + i * 140}ms` }}>
                <circle cx={dx} cy={dy} r="2.4" fill={d.verified ? "var(--color-gold-soft)" : "var(--fg-muted)"} />
                <circle cx={dx} cy={dy} r="6" fill="none" stroke="var(--color-gold)" strokeOpacity="0.35" strokeWidth="0.6" />
                <text
                  x={labelRight ? dx + 10 : dx - 10}
                  y={dy + 3.5}
                  textAnchor={labelRight ? "start" : "end"}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  letterSpacing="1.4"
                  fill="var(--fg-muted)"
                >
                  {d.isoCode}
                </text>
              </g>
            );
          })}
        </g>

        {/* Origin — Vientiane */}
        <g>
          <circle className="shv-gf-pulse" cx={ox} cy={oy} r="9" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
          <circle cx={ox} cy={oy} r="3.4" fill="var(--color-gold-soft)" />
          <text x={ox} y={oy + 20} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" letterSpacing="1.8" fill="var(--color-gold-soft)">
            {ORIGIN.label.toUpperCase()}
          </text>
        </g>
      </svg>
    </div>
  );
}
