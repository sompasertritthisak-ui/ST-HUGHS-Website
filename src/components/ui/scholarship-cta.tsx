import Link from "next/link";
import { ArrowRight, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export const SCHOLARSHIP_CHECK_HREF = "/enquire?topic=scholarships";

/**
 * The scholarship call to action, made to stand out (management feedback: give "Check scholarship eligibility" more
 * emphasis). Tall red button with an award icon, a soft pulsing ring (off under reduced motion) and a reassurance line.
 */
export function ScholarshipCta({ tone = "dark", className, note = "Free check with an advisor · no obligation" }: { tone?: "dark" | "light"; className?: string; note?: string | null }) {
  return (
    <div className={cn("flex flex-col items-start gap-2 max-sm:items-stretch", className)}>
      <Link
        href={SCHOLARSHIP_CHECK_HREF}
        className="cta-glow group inline-flex min-h-16 items-center justify-center gap-3 rounded-[var(--radius-sm)] bg-brand px-7 py-4 text-[1.0625rem] font-semibold text-white shadow-[0_18px_40px_-14px_rgb(207_27_24/0.75)] transition-[transform,background-color] duration-[var(--dur)] hover:-translate-y-0.5 hover:bg-brand-deep sm:text-[1.125rem]"
      >
        <Award aria-hidden className="size-5 shrink-0" strokeWidth={2} />
        Check scholarship eligibility
        <ArrowRight aria-hidden className="size-5 shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={2} />
      </Link>
      {note ? <p className={cn("text-[0.875rem] font-medium max-sm:text-center", tone === "dark" ? "text-white/75" : "text-fg-muted")}>{note}</p> : null}
    </div>
  );
}
