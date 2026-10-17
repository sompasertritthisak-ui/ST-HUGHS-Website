import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RouteLine } from "@/components/ui/route-line";
import { SplitHeading } from "@/components/ui/split-heading";
import type { ReactNode } from "react";

/**
 * Editorial section on a 12-column grid: a sticky label column (4) and an
 * offset content column (7, starting at 6). Sections render as full-bleed white
 * bands; a string title rises word by word, and every section opens on the red
 * route line so the page reads as one continuous journey.
 */
export function Section({
  id,
  eyebrow,
  title,
  lede,
  aside,
  children,
  className,
  divider = true,
  layout = "split",
}: {
  id?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
  divider?: boolean;
  /** split: label + content columns. full: heading row then full-width content (for card grids). */
  layout?: "split" | "full";
}) {
  const headingId = id ? `${id}-title` : undefined;
  const headingClass = "font-display text-[clamp(2rem,3.6vw,3rem)] leading-[1.02] text-fg text-balance";
  const heading =
    typeof title === "string" ? (
      <SplitHeading as="h2" id={headingId} text={title} className={headingClass} />
    ) : (
      <h2 id={headingId} className={headingClass}>
        {title}
      </h2>
    );
  return (
    <section id={id} aria-labelledby={headingId} className={cn("theme-light bg-bg text-fg scroll-mt-24", className)}>
      <div className="container-x">
      {divider ? <RouteLine node="start" /> : null}
      {layout === "split" ? (
        <div className="grid gap-10 py-14 md:py-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              {eyebrow ? <Eyebrow className="mb-5">{eyebrow}</Eyebrow> : null}
              {heading}
              {lede ? <p className="mt-5 max-w-md leading-relaxed text-fg-muted text-pretty">{lede}</p> : null}
              {aside ? <div className="mt-6">{aside}</div> : null}
            </div>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">{children}</div>
        </div>
      ) : (
        <div className="py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              {eyebrow ? <Eyebrow className="mb-5">{eyebrow}</Eyebrow> : null}
              {heading}
            </div>
            {lede || aside ? (
              <div className="lg:col-span-4 lg:col-start-9">
                {lede ? <p className="leading-relaxed text-fg-muted text-pretty">{lede}</p> : null}
                {aside ? <div className="mt-4">{aside}</div> : null}
              </div>
            ) : null}
          </div>
          <div className="mt-12">{children}</div>
        </div>
      )}
      </div>
    </section>
  );
}
