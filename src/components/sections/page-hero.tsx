import { Eyebrow } from "@/components/ui/eyebrow";
import { RouteLine } from "@/components/ui/route-line";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Standard interior page opener. One h1 per page. */
export function PageHero({ eyebrow, title, lede, aside, className, children }: { eyebrow?: ReactNode; title: ReactNode; lede?: ReactNode; aside?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <section className={cn("container-x pb-12 pt-16 md:pt-24", className)}>
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          {eyebrow ? <Eyebrow className="mb-6">{eyebrow}</Eyebrow> : null}
          <h1 className="font-display text-[clamp(2.75rem,7vw,5.75rem)] leading-[0.98] text-fg text-balance">{title}</h1>
          {lede ? <p className="mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted text-pretty md:text-xl">{lede}</p> : null}
          {children}
        </div>
        {aside ? <div className="lg:col-span-4">{aside}</div> : null}
      </div>
      <RouteLine className="mt-12" node="start" />
    </section>
  );
}
