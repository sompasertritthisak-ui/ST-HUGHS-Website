"use client";

import { useState } from "react";
import { Play, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParsedVideo } from "@/lib/video";

/**
 * A testimonial video that costs nothing until it is played: a poster and a play button first, then the player
 * (YouTube via the privacy-enhanced domain, Vimeo with do-not-track, or an uploaded file). Links to other sites open
 * in a new tab.
 */
export function VideoTestimonial({
  video,
  poster,
  title,
  caption,
  size = "md",
  className,
}: {
  video: ParsedVideo | null;
  poster?: string | null;
  title: string;
  caption?: string | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const still = poster ?? (video?.kind === "youtube" ? video.thumb : null);
  const comingSoon = !video;

  const frame = cn("relative aspect-video overflow-hidden rounded-[var(--radius)] bg-midnight", className);

  if (playing && video && video.kind !== "link") {
    return (
      <figure className={frame}>
        {video.kind === "file" ? (
          <video src={video.src} poster={still ?? undefined} controls autoPlay playsInline className="absolute inset-0 size-full object-cover" />
        ) : (
          <iframe
            src={video.embed}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        )}
      </figure>
    );
  }

  const body = (
    <>
      {still ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote YouTube stills and CMS posters; sizes vary
        <img src={still} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.04]" />
      ) : null}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/35 to-midnight/5" />
      <span
        aria-hidden
        className={cn(
          "absolute flex items-center justify-center rounded-full transition-transform duration-[var(--dur)] ease-[var(--ease-out)] group-hover:scale-110",
          // Large frames: play button centred. Small frames: top-right, clear of the title block.
          size === "lg" ? "right-4 top-4 size-12 lg:right-auto lg:left-1/2 lg:top-1/2 lg:size-20 lg:-translate-x-1/2 lg:-translate-y-1/2" : "right-4 top-4 size-12",
          comingSoon ? "border border-white/50 bg-white/10 text-white backdrop-blur-sm" : "bg-brand text-white shadow-[0_12px_40px_-8px_rgb(207_27_24/0.7)]",
        )}
      >
        {video?.kind === "link" ? <ArrowUpRight className={size === "lg" ? "size-5 lg:size-8" : "size-5"} /> : <Play className={cn("translate-x-0.5 fill-current", size === "lg" ? "size-5 lg:size-8" : "size-5")} />}
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4 text-left sm:p-5">
        {comingSoon ? <span className="mb-2 inline-block rounded-full bg-midnight/75 px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-white">Coming soon</span> : null}
        <span className={cn("block font-display leading-tight text-white", size === "lg" ? "text-[clamp(1.5rem,2.6vw,2.25rem)]" : "text-[1.375rem]")}>{title}</span>
        {caption ? <span className="mt-1 block text-[0.8125rem] font-medium text-white/80">{caption}</span> : null}
      </span>
    </>
  );

  if (comingSoon) {
    return (
      <figure className={cn(frame, "group")} aria-label={`${title} — alumni video coming soon`}>
        {body}
      </figure>
    );
  }
  if (video.kind === "link") {
    return (
      <a href={video.href} target="_blank" rel="noopener noreferrer" className={cn(frame, "group block")} aria-label={`Watch ${title} (opens in a new tab)`}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={() => setPlaying(true)} className={cn(frame, "group block w-full")} aria-label={`Play video: ${title}`}>
      {body}
    </button>
  );
}
