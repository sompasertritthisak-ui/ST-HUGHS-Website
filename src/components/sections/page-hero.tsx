import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RouteLine } from "@/components/ui/route-line";
import { SplitHeading } from "@/components/ui/split-heading";
import { BackdropVideo } from "@/components/cinematic/backdrop-video";
import type { SceneMedia } from "@/components/cinematic/cinematic-scene";
import { cn } from "@/lib/utils";

/**
 * Standard interior page opener. One h1 per page. A string title rises word by word (`SplitHeading`,
 * with an optional `accent` phrase in blue); a JSX title renders as given. `media` adds the page's
 * cinematic frame beneath the title — the same world as the homepage, so every page opens like a
 * chapter of one film.
 */
export function PageHero({
  eyebrow,
  title,
  accent,
  lede,
  aside,
  media,
  className,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: string;
  lede?: ReactNode;
  aside?: ReactNode;
  media?: SceneMedia;
  className?: string;
  children?: ReactNode;
}) {
  const headingClass = "font-display text-[clamp(2.75rem,7vw,5.75rem)] leading-[0.98] text-fg text-balance";
  return (
    <section className={cn("container-x pb-12 pt-16 md:pt-24", className)}>
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          {eyebrow ? <Eyebrow className="mb-6">{eyebrow}</Eyebrow> : null}
          {typeof title === "string" ? (
            <SplitHeading as="h1" text={title} accent={accent} accentClassName="text-blue" className={headingClass} />
          ) : (
            <h1 className={headingClass}>{title}</h1>
          )}
          {lede ? <p className="mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted text-pretty md:text-xl">{lede}</p> : null}
          {children}
        </div>
        {aside ? <div className="lg:col-span-4">{aside}</div> : null}
      </div>
      {media ? (
        <div className="theme-dark relative mt-12 aspect-[16/9] overflow-hidden rounded-[var(--radius-lg)] bg-bg md:aspect-[21/9]">
          <BackdropVideo media={media} />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_19_80/0.55)_0%,transparent_50%)]" />
          <div aria-hidden className="grain absolute inset-0" />
          <span aria-hidden className="absolute bottom-5 left-5 h-[3px] w-16 bg-route" />
        </div>
      ) : null}
      <RouteLine className="mt-12" node="start" />
    </section>
  );
}
