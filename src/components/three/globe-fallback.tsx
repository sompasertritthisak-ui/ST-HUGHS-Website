import { ORIGIN, angularDistance, project, type GlobeDestination } from "./geo";
import { cn } from "@/lib/utils";

/**
 * Static fallback for the hero globe: the real Blue Marble map (equirectangular,
 * re-centred on Asia), the origin node and curved routes that draw on with
 * stroke-dasharray. Server-safe (no hooks) so it can also be the SSR frame
 * before the WebGL scene mounts. Same palette, same story.
 */

const W = 720;
const H = 360;
/** Equirectangular projection re-centred on 40°E so the origin (Vientiane) and every destination sit inside the frame. */
const CENTRE_LNG = 40;
/** Rounded to 0.01px: server (V8) and Safari (JavaScriptCore) differ in the last digits of trig results, which made the
 *  server-rendered SVG paths mismatch on hydration in iOS Safari. */
const r2 = (n: number) => Math.round(n * 100) / 100;
const px = (lat: number, lng: number): [number, number] => {
  const [x, y] = project(lat, ((((lng - CENTRE_LNG + 180) % 360) + 360) % 360) - 180, W, H);
  return [r2(x), r2(y)];
};


export function GlobeFallback({ destinations, className, animate = true, tone = "dark" }: { destinations: GlobeDestination[]; className?: string; animate?: boolean; tone?: "dark" | "light" }) {
  const [ox, oy] = px(ORIGIN.lat, ORIGIN.lng);
  /** The texture's left edge is 180°W; the frame starts at CENTRE_LNG − 180°, so shift and wrap it. */
  const shift = (CENTRE_LNG / 360) * W;

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
        viewBox={`0 30 ${W} 270`}
        className={cn("h-full w-full", animate ? "shv-gf-animate" : "shv-gf-static")}
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        <defs>
          <clipPath id="shv-gf-clip">
            <rect width={W} height={H} rx="6" />
          </clipPath>
        </defs>
        <g clipPath="url(#shv-gf-clip)">
          <image href="/textures/earth/earth_atmos_2048.jpg" x={-shift} y={0} width={W} height={H} preserveAspectRatio="none" />
          <image href="/textures/earth/earth_atmos_2048.jpg" x={W - shift} y={0} width={W} height={H} preserveAspectRatio="none" />
          <rect width={W} height={H} fill="var(--color-midnight)" fillOpacity={tone === "light" ? "0" : "0.35"} />
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
                d={`M ${ox} ${oy} Q ${r2(mx)} ${r2(my)} ${dx} ${dy}`}
                stroke="var(--color-brand)"
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
                <circle cx={dx} cy={dy} r="2.4" fill={d.verified ? "var(--color-brand-soft)" : "var(--fg-muted)"} />
                <circle cx={dx} cy={dy} r="6" fill="none" stroke="var(--color-brand)" strokeOpacity="0.35" strokeWidth="0.6" />
                <text
                  x={labelRight ? dx + 10 : dx - 10}
                  y={dy + 3.5}
                  textAnchor={labelRight ? "start" : "end"}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  letterSpacing="1.4"
                  fill="var(--fg-muted)"
                >
                  <tspan className="notranslate">{d.isoCode}</tspan>
                </text>
              </g>
            );
          })}
        </g>

        {/* Origin — Vientiane */}
        <g>
          <circle className="shv-gf-pulse" cx={ox} cy={oy} r="9" fill="none" stroke="var(--color-brand)" strokeWidth="0.8" />
          <circle cx={ox} cy={oy} r="3.4" fill="var(--color-brand-soft)" />
          <text x={ox} y={oy + 20} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" letterSpacing="1.8" fill="var(--color-brand-soft)">
            {ORIGIN.label.toUpperCase()}
          </text>
        </g>
      </svg>
    </div>
  );
}
