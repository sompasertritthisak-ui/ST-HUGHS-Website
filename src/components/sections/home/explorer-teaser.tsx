import { PathwayCard } from "@/components/cards/pathway-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import type { PathwayWithRelations } from "@/lib/content";

/** The explorer's step chain — structural UI labels, not content. */
const CHAIN: { label: string; hint: string }[] = [
  { label: "Start", hint: "Where you are now" },
  { label: "Programme", hint: "Foundation or Year One" },
  { label: "Subject", hint: "Your subject route" },
  { label: "Destination", hint: "The country" },
  { label: "University", hint: "The partner" },
  { label: "Degree", hint: "Bachelor's" },
  { label: "Career", hint: "Where it leads" },
];

/** Act IV — the pathway. A line becomes a route; three published routes follow it. */
export function ExplorerTeaser({ pathways }: { pathways: PathwayWithRelations[] }) {
  const featured = pathways.slice(0, 3);
  return (
    <section aria-labelledby="explorer-title" className="relative overflow-hidden">
      <style>{`
        .shv-chain .shv-chain-line { transform: scaleX(0); transform-origin: left center; transition: transform 1300ms var(--ease-out); }
        .shv-chain .shv-chain-vline { transform: scaleY(0); transform-origin: center top; transition: transform 1300ms var(--ease-out); }
        .shv-chain.is-visible .shv-chain-line { transform: scaleX(1); }
        .shv-chain.is-visible .shv-chain-vline { transform: scaleY(1); }
        .shv-chain .shv-chain-step { opacity: 0; transform: translateY(8px); transition: opacity 420ms var(--ease-out), transform 420ms var(--ease-out); transition-delay: var(--d, 0ms); }
        .shv-chain.is-visible .shv-chain-step { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .shv-chain .shv-chain-line, .shv-chain .shv-chain-vline { transform: none; transition: none; }
          .shv-chain .shv-chain-step { opacity: 1; transform: none; transition: none; }
        }
      `}</style>

      <div className="container-x section-y">
        <div className="grid grid-cols-12 gap-x-8 gap-y-10 lg:items-end">
          <Reveal className="col-span-12 lg:col-span-7">
            <p className="eyebrow eyebrow-rule">Pathway</p>
            <h2 id="explorer-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
              Seven decisions. One line from here to there.
            </h2>
          </Reveal>
          <Reveal className="col-span-12 lg:col-span-4 lg:col-start-9" delay={80}>
            <p className="text-lg leading-relaxed text-fg-muted text-pretty">
              The Pathway Explorer walks you through each step and shows the published routes that match. Start with what you know; the rest narrows as you go.
            </p>
            <div className="mt-6">
              <Button href="/pathway-explorer" arrow="right">
                Open the Pathway Explorer
              </Button>
            </div>
          </Reveal>
        </div>

        {/* The chain */}
        <Reveal as="ol" className="shv-chain relative mt-16 grid grid-cols-1 gap-y-8 md:grid-cols-7 md:gap-x-4 md:gap-y-0 lg:mt-24" aria-label="Pathway Explorer steps">
          <span aria-hidden className="shv-chain-line absolute left-0 right-0 top-[6px] hidden h-px bg-route md:block" />
          <span aria-hidden className="shv-chain-vline absolute bottom-2 left-[6px] top-0 w-px bg-route md:hidden" />
          {CHAIN.map((step, i) => {
            const terminal = i === 0 || i === CHAIN.length - 1;
            return (
              <li
                key={step.label}
                className="shv-chain-step relative flex gap-4 md:flex-col md:gap-0"
                style={{ "--d": `${200 + i * 140}ms` } as React.CSSProperties}
              >
                <span
                  aria-hidden
                  className={`relative z-10 mt-[1px] size-[13px] shrink-0 rounded-full border ${terminal ? "border-route bg-route shadow-[0_0_14px_var(--route)]" : "border-route bg-bg"}`}
                />
                <div className="md:mt-5">
                  <span className="block font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-gold-soft">
                    <span className="mr-2 text-fg-subtle tabular">{String(i + 1).padStart(2, "0")}</span>
                    {step.label}
                  </span>
                  <span className="mt-1 block text-sm text-fg-muted">{step.hint}</span>
                </div>
              </li>
            );
          })}
        </Reveal>

        {/* Three routes that follow the line */}
        <div className="mt-16 lg:mt-24">
          <div className="mb-8 flex items-end justify-between gap-6">
            <p className="eyebrow eyebrow-rule">Featured routes</p>
            <Button href="/pathways" variant="ghost" arrow="right" className="text-sm">
              All pathways
            </Button>
          </div>
          {featured.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={i * 40}>
                  <PathwayCard pathway={p} className="h-full" />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title="Routes are being confirmed" body="Published pathways appear here once their structure has been verified with the partner university." />
          )}
        </div>
      </div>
    </section>
  );
}
