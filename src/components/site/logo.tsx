import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark. SHV's official logo file should be uploaded via the CMS media
 * library and referenced from SiteSetting "branding"; until then the wordmark
 * is typographic so no brand asset is invented.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-3", className)} aria-label="St Hugh's College Vientiane — home">
      <span aria-hidden className="relative inline-flex size-8 items-center justify-center">
        <span className="absolute inset-0 rounded-[3px] border border-gold/70" />
        <span className="font-display text-[1.05rem] leading-none text-gold-soft">S</span>
        <span className="absolute -bottom-px left-1/2 h-px w-3 -translate-x-1/2 bg-gold" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.25rem] tracking-[-0.01em] text-fg">St Hugh&apos;s College</span>
          <span className="mt-1 font-mono text-[0.5625rem] uppercase tracking-[0.22em] text-fg-muted">Vientiane · Lao PDR</span>
        </span>
      )}
    </Link>
  );
}
