import { getMessagingSettings } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { RouteLine } from "@/components/ui/route-line";
import { FlagStripe } from "@/components/ui/flag-stripe";
import { BackdropVideo } from "@/components/cinematic/backdrop-video";
import { CINEMATIC } from "@/components/cinematic/media";

/** The closing statement. Returns the reader to the origin: start here. */
export async function FinalCta() {
  const m = await getMessagingSettings();
  const [first, ...rest] = m.finalCtaTitle.split(" ");
  return (
    <section aria-labelledby="final-cta" className="theme-dark bg-bg text-fg grain relative overflow-hidden">
      <FlagStripe className="relative z-10" />
      <BackdropVideo media={CINEMATIC.finale} opacity={0.6} />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(11_19_80/0.95)_0%,rgb(11_19_80/0.7)_50%,rgb(11_19_80/0.45)_100%)]" />
      <div className="container-x section-y relative z-10">
        <RouteLine className="absolute left-[var(--gutter)] right-[var(--gutter)] top-0" node="start" />
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow eyebrow-rule">Start here</p>
            <h2 id="final-cta" className="font-display mt-6 text-[clamp(3rem,8vw,7.5rem)] leading-[0.95] text-fg text-balance">
              <span className="italic text-brand-soft">{first}</span> {rest.join(" ")}
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="text-lg leading-relaxed text-fg-muted text-pretty">{m.finalCtaBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/pathway-explorer" arrow="right">
                Explore your pathway
              </Button>
              <Button href="/consultation" variant="secondary">
                Talk to an advisor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
