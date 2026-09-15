import { Reveal } from "@/components/ui/reveal";
import { RouteLine } from "@/components/ui/route-line";
import type { DestinationWithRelations } from "@/lib/content";

const NEEDS_ARTICLE = new Set(["United Kingdom", "United States", "United Arab Emirates", "Netherlands", "Philippines", "Czech Republic"]);

function withArticle(country: string) {
  return NEEDS_ARTICLE.has(country) ? `the ${country}` : country;
}

function formatDisjunction(items: string[]) {
  if (items.length === 0) return "";
  try {
    return new Intl.ListFormat("en-GB", { style: "long", type: "disjunction" }).format(items);
  } catch {
    return items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
  }
}

/** Act II — the whole proposition in one sentence. Origin → destination → future. */
export function PathwayStatement({ destinations }: { destinations: DestinationWithRelations[] }) {
  const list = formatDisjunction(destinations.map((d) => withArticle(d.country)));
  return (
    <section aria-labelledby="statement-title" className="relative">
      <div className="container-x section-y">
        <RouteLine node="start" className="mb-14 lg:mb-20" />
        <div className="grid grid-cols-12 gap-y-10">
          <Reveal className="col-span-12 lg:col-span-3">
            <p className="eyebrow eyebrow-rule">The route</p>
          </Reveal>
          <Reveal className="col-span-12 lg:col-span-9" delay={80}>
            <h2 id="statement-title" className="font-display max-w-[24ch] text-[clamp(2.125rem,4.8vw,4.5rem)] leading-[1.04] text-fg text-balance">
              <span className="text-fg-muted">A foundation year in</span> Vientiane.{" "}
              {list ? (
                <>
                  <span className="text-fg-muted">A degree in</span> <span className="text-gold-soft">{list}</span>.{" "}
                </>
              ) : (
                <>
                  <span className="text-fg-muted">A degree with an</span> NCUK University Partner.{" "}
                </>
              )}
              <span className="text-fg-muted">A career</span> anywhere.
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-fg-muted text-pretty">
              Every route on this site begins at the same node. The list of destinations is drawn from the pathways SHV has published, and it grows only as
              partnerships are confirmed.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
