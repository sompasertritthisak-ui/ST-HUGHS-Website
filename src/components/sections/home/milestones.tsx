import { z } from "zod";
import { getSetting } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";

export const MilestonesSchema = z.object({
  items: z
    .array(z.object({ year: z.string(), label: z.string(), detail: z.string().optional().default(""), sourceNote: z.string().optional().default("") }))
    .default([]),
});

/**
 * "The route so far" — an institutional timeline drawn along the red line.
 * Content lives in SiteSetting "milestones" (CMS-driven, verified dates only).
 */
export async function Milestones() {
  const { items } = await getSetting("milestones", MilestonesSchema);
  if (items.length < 2) return null;
  return (
    <section aria-labelledby="milestones-title" className="theme-light bg-bg text-fg border-t border-line">
      <style>{`
        .shv-ml .shv-ml-line { transform: scaleX(0); transform-origin: left center; transition: transform 1600ms var(--ease-out); }
        .shv-ml.is-visible .shv-ml-line { transform: scaleX(1); }
        .shv-ml .shv-ml-item { opacity: 0; transform: translateY(10px); transition: opacity 500ms var(--ease-out), transform 500ms var(--ease-out); transition-delay: var(--d, 0ms); }
        .shv-ml.is-visible .shv-ml-item { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .shv-ml .shv-ml-line, .shv-ml .shv-ml-item { transform: none; opacity: 1; transition: none; } }
      `}</style>
      <div className="container-x section-y">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow eyebrow-rule">The route so far</p>
            <h2 id="milestones-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
              A young institution, moving quickly.
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={80}>
            <p className="text-lg leading-relaxed text-fg-muted text-pretty">Every date below is on the public record. Hover a milestone for the detail.</p>
          </Reveal>
        </div>

        <Reveal className="shv-ml relative mt-16 md:mt-24">
          <span aria-hidden className="shv-ml-line absolute left-0 top-0 hidden h-px w-full bg-route md:block" />
          <span aria-hidden className="absolute bottom-0 left-[7px] top-0 w-px bg-route md:hidden" />
          <ol className="grid gap-10 md:grid-cols-5 md:gap-6" aria-label="Milestones">
            {items.map((m, i) => (
              <li key={`${m.year}-${i}`} className="shv-ml-item group relative pl-8 md:pl-0" style={{ "--d": `${200 + i * 160}ms` } as React.CSSProperties}>
                <span aria-hidden className="absolute left-0 top-[6px] size-[15px] rounded-full border border-route bg-bg transition-[background-color,transform] duration-[var(--dur)] group-hover:scale-125 group-hover:bg-route md:-top-[7px] md:left-0" />
                <div className="md:pt-8">
                  <p className="font-display text-[clamp(2rem,3vw,2.75rem)] leading-none text-fg tabular">{m.year}</p>
                  <p className="mt-3 text-[1.0625rem] font-medium leading-snug text-fg">{m.label}</p>
                  {m.detail ? <p className="mt-2 text-sm leading-relaxed text-fg-muted transition-opacity duration-[var(--dur)] md:opacity-70 md:group-hover:opacity-100">{m.detail}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
