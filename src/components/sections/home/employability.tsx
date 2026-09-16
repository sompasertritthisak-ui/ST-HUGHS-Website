import type { OutcomeMetric } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Stat } from "@/components/ui/stat";

/** Act IX — Future. From education to opportunity. Figures render only when verified. */
export function Employability({ metrics }: { metrics: OutcomeMetric[] }) {
  const shown = metrics.length > 0 ? metrics.slice(0, 4) : [{ id: "pending", label: "Graduate outcomes", value: null, unit: null, sourceNote: null, verificationStatus: "PENDING" }];
  return (
    <section aria-labelledby="future-title" className="theme-light bg-bg text-fg border-t border-line">
      <div className="container-x section-y grid grid-cols-12 gap-x-8 gap-y-14">
        <Reveal className="col-span-12 lg:col-span-5">
          <p className="eyebrow eyebrow-rule">Future</p>
          <h2 id="future-title" className="font-display mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] text-fg text-balance">
            From education to opportunity
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted text-pretty">
            An NCUK qualification is built for progression: it leads into a degree at an NCUK University Partner, and the degree leads on. Careers guidance at
            SHV starts at the beginning of that route — choosing a subject with a destination in mind — and continues through university applications.
          </p>
          <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-fg-subtle">Outcome figures are published here only once they have been verified.</p>
          <div className="mt-8">
            <Button href="/careers" variant="ghost" arrow="right">
              Careers &amp; employability
            </Button>
          </div>
        </Reveal>
        <div className="col-span-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
          {shown.map((m, i) => (
            <Reveal key={m.id} delay={i * 40}>
              <Stat label={m.label} value={m.value} unit={m.unit} sourceNote={m.sourceNote} verified={m.verificationStatus === "VERIFIED"} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
