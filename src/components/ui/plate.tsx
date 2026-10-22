import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Media } from "@prisma/client";

/**
 * Image plate. Renders CMS media with focal point, or an intentional
 * placeholder naming the media slot when no approved photograph exists yet.
 * Never uses stock or AI-generated people.
 */
export function Plate({
  media,
  slot,
  aspect = "4/3",
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  caption,
}: {
  media?: Pick<Media, "url" | "alt" | "focalX" | "focalY" | "width" | "height" | "caption" | "usageStatus"> | null;
  slot: string;
  aspect?: "16/9" | "4/3" | "3/4" | "1/1" | "21/9" | "3/2";
  className?: string;
  sizes?: string;
  priority?: boolean;
  caption?: string | null;
}) {
  const ratio = { "16/9": "aspect-[16/9]", "4/3": "aspect-[4/3]", "3/4": "aspect-[3/4]", "1/1": "aspect-square", "21/9": "aspect-[21/9]", "3/2": "aspect-[3/2]" }[aspect];
  const usable = media && media.url && media.usageStatus === "APPROVED";
  return (
    <figure className={cn("relative", className)}>
      <div className={cn("relative w-full overflow-hidden rounded-[var(--radius)] border border-line bg-bg-raised", !usable && "border-transparent", ratio)}>
        {usable ? (
          <Image
            src={media.url}
            alt={media.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
            style={{ objectPosition: `${Math.round((media.focalX ?? 0.5) * 100)}% ${Math.round((media.focalY ?? 0.5) * 100)}%` }}
          />
        ) : (
          // No approved photograph yet: a branded panel (deep blue, the red route line, the white lockup)
          // that reads as intentional, with a quiet "photo coming soon" note. Never a stock or AI person.
          <div className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(135deg,#0b1350_0%,#142478_100%)] p-4 sm:p-5">
            <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="none">
              <path d="M -10 260 Q 200 40 410 120" fill="none" stroke="#cf1b18" strokeWidth="1.5" strokeOpacity="0.85" vectorEffect="non-scaling-stroke" />
            </svg>
            <span aria-hidden className="relative flex justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand asset */}
              <img src="/brand/shv-lockup-white.png" alt="" className="h-6 w-auto opacity-80 sm:h-7" />
            </span>
            <span className="relative font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-white/75">
              Photo coming soon<span className="text-white/45"> · {slot}</span>
            </span>
          </div>
        )}
      </div>
      {(caption ?? media?.caption) ? <figcaption className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{caption ?? media?.caption}</figcaption> : null}
    </figure>
  );
}
