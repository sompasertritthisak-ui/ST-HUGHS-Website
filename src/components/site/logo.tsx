import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Official St Hugh's College Vientiane lockup (from the SHV brand assets).
 * `tone="light"` is the white wordmark for deep-blue grounds; `tone="dark"` is the
 * blue wordmark for white grounds (admin, print). The red rule under the name is
 * part of the logo and is the origin of the site's red "route line" motif.
 */
export function Logo({ className, compact = false, tone = "light", priority = false }: { className?: string; compact?: boolean; tone?: "light" | "dark"; priority?: boolean }) {
  const src = compact ? "/brand/shv-mark.png" : tone === "light" ? "/brand/shv-lockup-white.png" : "/brand/shv-lockup.png";
  return (
    <Link href="/" className={cn("notranslate inline-flex shrink-0 items-center", className)} translate="no" aria-label="St Hugh's College Vientiane — home">
      {compact ? (
        <Image src={src} alt="St Hugh's College Vientiane" width={40} height={40} priority={priority} className="size-10 rounded-[3px]" />
      ) : (
        <Image src={src} alt="St Hugh's College Vientiane" width={1600} height={405} priority={priority} className="h-9 w-auto md:h-10" sizes="180px" />
      )}
    </Link>
  );
}
