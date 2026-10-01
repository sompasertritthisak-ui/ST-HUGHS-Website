import { Button } from "@/components/ui/button";

/** Compact conversion band used at the end of programme, pathway and university pages. */
export function ConsultationBand({ title = "Not sure which route fits?", body = "Book a free consultation. An advisor checks your qualifications against the entry requirements and gives you a clear next-step plan.", primaryHref = "/consultation", primaryLabel = "Book a free consultation", secondaryHref, secondaryLabel, tone = "card" }: { title?: string; body?: string; primaryHref?: string; primaryLabel?: string; secondaryHref?: string; secondaryLabel?: string; /** `band`: full-bleed red band (homepage); `card`: raised card inside the page. */ tone?: "card" | "band" }) {
  if (tone === "band") {
    return (
      <section className="theme-brand bg-bg text-fg">
        <div className="container-x flex flex-col gap-8 py-14 md:flex-row md:items-center md:justify-between md:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow eyebrow-rule">Free consultation</p>
            <h2 className="font-display mt-5 text-[clamp(2rem,4vw,3.5rem)] leading-[1.02] text-fg text-balance">{title}</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-fg-muted text-pretty">{body}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button href={primaryHref} size="lg" arrow="right">
              {primaryLabel}
            </Button>
            {secondaryHref && secondaryLabel ? (
              <Button href={secondaryHref} variant="secondary" size="lg">
                {secondaryLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="container-x py-12">
      <div className="surface-raised flex flex-col gap-6 rounded-[var(--radius-lg)] p-8 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="max-w-xl">
          <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] text-fg">{title}</h2>
          <p className="mt-3 text-fg-muted">{body}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button href={primaryHref} arrow="right">
            {primaryLabel}
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button href={secondaryHref} variant="secondary">
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
