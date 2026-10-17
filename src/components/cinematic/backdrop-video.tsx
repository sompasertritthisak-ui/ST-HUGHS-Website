"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { SceneMedia } from "./cinematic-scene";

/**
 * A living background behind an existing section (hero, final call to action). Poster first,
 * clip only when near the viewport and allowed by the visitor's motion and data preferences.
 * The caller supplies the veil so each section keeps its own contrast.
 */
export function BackdropVideo({ media, className, opacity = 1 }: { media: SceneMedia; className?: string; opacity?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
    const lowData = Boolean(nav.connection?.saveData) || /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
    if (media.src && !reduced && !lowData) setUseVideo(true);
  }, [media.src]);

  useEffect(() => {
    const el = ref.current;
    const video = videoRef.current;
    if (!el || !video || !useVideo || !media.src) return;
    const src = media.src;
    let loaded = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (!loaded) {
              video.src = src;
              video.load();
              loaded = true;
            }
            video.play().catch(() => undefined);
          } else video.pause();
        }
      },
      { rootMargin: "40% 0px 40% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [useVideo, media.src]);

  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ opacity }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.poster} alt="" className={cn("absolute inset-0 size-full object-cover", !media.src && "kenburns")} style={media.position ? { objectPosition: media.position } : undefined} loading="lazy" decoding="async" />
      {useVideo ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          poster={media.poster}
          className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-[1400ms] ease-out [&.is-playing]:opacity-100"
          style={media.position ? { objectPosition: media.position } : undefined}
          onPlaying={(e) => e.currentTarget.classList.add("is-playing")}
        />
      ) : null}
    </div>
  );
}
