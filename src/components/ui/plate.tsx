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
      <div className={cn("relative w-full overflow-hidden rounded-[var(--radius)] border border-line bg-bg-raised", ratio)}>
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
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="none">
              <defs>
                <pattern id="plate-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#plate-grid)" />
              <line x1="0" y1="100%" x2="100%" y2="0" stroke="var(--route)" strokeWidth="0.75" />
            </svg>
            <span className="relative font-mono text-[0.625rem] uppercase tracking-[0.16em] text-fg-subtle">Photography plate</span>
            <span className="relative font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-brand-soft">{slot}</span>
          </div>
        )}
      </div>
      {(caption ?? media?.caption) ? <figcaption className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-subtle">{caption ?? media?.caption}</figcaption> : null}
    </figure>
  );
}
