"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

/** A backdrop: a looping clip over its poster, or a still alone (slow drift). */
export type SceneMedia = { src?: string; poster: string; position?: string };

function Words({ text, className }: { text: string; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <span key={`${w}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-baseline">
            <span className={cn("cs-word inline-block will-change-transform", className)}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

/**
 * A cinematic chapter opener. The section is taller than the viewport; inside it a
 * full-screen stage stays pinned while the visitor scrolls, so the backdrop pushes in from a
 * slight overscan, the title rises word by word out of depth (perspective + rotateX) and the
 * copy lifts away as the next act arrives — the "3D scroll" moment between two acts of the page.
 *
 * Respect for the visitor: the clip is requested only near the viewport, plays only while visible,
 * and is replaced by its poster under reduced motion or reduced data. Everything renders on the
 * server in its final state; motion is layered on afterwards.
 */
export function CinematicScene({
  id,
  index,
  total,
  eyebrow,
  title,
  accent,
  body,
  media,
  backdrop,
  cta,
  align = "left",
  className,
  children,
}: {
  id: string;
  index: number;
  total: number;
  eyebrow: string;
  title: string;
  accent?: string;
  body?: string;
  /** Poster (with optional clip) behind the chapter. Omit when `backdrop` supplies a live scene. */
  media?: SceneMedia;
  /** A live backdrop (e.g. a three.js scene) rendered instead of `media`. */
  backdrop?: ReactNode;
  cta?: { href: string; label: string };
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
    const lowData = Boolean(nav.connection?.saveData) || /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
    if (media?.src && !reduced && !lowData) setUseVideo(true);
    if (reduced) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const backdrop = el.querySelector<HTMLElement>("[data-backdrop]");
      const copy = el.querySelector<HTMLElement>("[data-copy]");
      const veil = el.querySelector<HTMLElement>("[data-veil]");
      const words = el.querySelectorAll<HTMLElement>(".cs-word");
      const rest = el.querySelectorAll<HTMLElement>("[data-rest]");
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6 } });
      if (backdrop) tl.fromTo(backdrop, { scale: 1.16, yPercent: -3 }, { scale: 1, yPercent: 3, ease: "none", duration: 1 }, 0);
      if (veil) tl.fromTo(veil, { opacity: 0.9 }, { opacity: 0.5, ease: "none", duration: 1 }, 0);
      if (copy) tl.fromTo(copy, { rotateX: 16, y: 80 }, { rotateX: 0, y: 0, ease: "power2.out", duration: 0.4 }, 0.02);
      if (words.length) tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, ease: "power3.out", duration: 0.32, stagger: 0.035 }, 0.06);
      if (rest.length) tl.fromTo(rest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, ease: "power2.out", duration: 0.25, stagger: 0.05 }, 0.22);
      if (copy) tl.to(copy, { y: -80, opacity: 0, ease: "power1.in", duration: 0.28 }, 0.72);
    }, el);
    return () => ctx.revert();
  }, [media?.src]);

  useEffect(() => {
    const el = root.current;
    const video = videoRef.current;
    if (!el || !video || !useVideo || !media?.src) return;
    let loaded = false;
    const src = media.src;
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
      { rootMargin: "60% 0px 60% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [useVideo, media?.src]);

  const number = `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <section ref={root} id={id} aria-labelledby={`${id}-title`} className={cn("theme-dark relative h-[190vh] bg-midnight text-white", className)}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden [perspective:1200px]">
        <div data-backdrop className="absolute inset-0 will-change-transform">
          {backdrop ? <div className="absolute inset-0">{backdrop}</div> : null}
          {media ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.poster}
              alt=""
              className={cn("absolute inset-0 size-full object-cover", !media.src && "kenburns")}
              style={media.position ? { objectPosition: media.position } : undefined}
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {useVideo && media ? (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              poster={media.poster}
              aria-hidden
              className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-[1200ms] ease-out [&.is-playing]:opacity-100"
              style={media.position ? { objectPosition: media.position } : undefined}
              onPlaying={(e) => e.currentTarget.classList.add("is-playing")}
            />
          ) : null}
        </div>
        <div data-veil className={cn("absolute inset-0", backdrop ? "bg-[linear-gradient(to_top,rgb(11_19_80/0.85)_0%,rgb(11_19_80/0.15)_40%,transparent_70%)]" : "bg-[linear-gradient(to_top,rgb(11_19_80/0.94)_0%,rgb(11_19_80/0.5)_45%,rgb(11_19_80/0.3)_100%)]")} />
        <div aria-hidden className="grain absolute inset-0" />

        {/* Chapter marker */}
        <div className="container-x absolute inset-x-0 top-[calc(72px+1.5rem)] flex items-center justify-between font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-white/70">
          <span>Chapter {number}</span>
          <span className="hidden items-center gap-3 sm:inline-flex">
            <span aria-hidden className="h-px w-10 bg-route" />
            St Hugh&rsquo;s College Vientiane
          </span>
        </div>

        <div className={cn("container-x relative flex h-full flex-col justify-end pb-[clamp(3rem,10vh,7rem)]", align === "center" && "items-center text-center")}>
          <div data-copy className={cn("max-w-4xl [transform-style:preserve-3d]", align === "center" && "mx-auto")}>
            <p data-rest className={cn("eyebrow eyebrow-rule text-brand-soft", align === "center" && "justify-center")}>
              {eyebrow}
            </p>
            <h2 id={`${id}-title`} className="font-display mt-6 text-[clamp(2.75rem,7.2vw,6.75rem)] leading-[0.95] text-white text-balance">
              <Words text={title} />
              {accent ? (
                <>
                  {" "}
                  <Words text={accent} className="italic text-brand-soft" />
                </>
              ) : null}
            </h2>
            {body ? (
              <p data-rest className={cn("mt-6 max-w-xl text-lg leading-relaxed text-white/85 text-pretty md:text-xl", align === "center" && "mx-auto")}>
                {body}
              </p>
            ) : null}
            {cta ? (
              <Link data-rest href={cta.href} className="group mt-8 inline-flex items-center gap-3 text-[0.9375rem] text-white">
                {cta.label}
                <span aria-hidden className="h-px w-8 bg-route transition-[width] duration-[var(--dur)] group-hover:w-14" />
              </Link>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
