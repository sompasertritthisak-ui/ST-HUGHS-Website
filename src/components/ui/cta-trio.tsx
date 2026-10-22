import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { cn } from "@/lib/utils";

/**
 * The site's three main calls to action, always in the same order and style so a visitor learns
 * them once: Book a tour (primary, red), Explore your pathway, Talk to an advisor.
 */
export function CtaTrio({ size = "md", className, compact = false }: { size?: "sm" | "md" | "lg"; className?: string; compact?: boolean }) {
  return (
    // Phones: one even, full-width stack (ragged widths read as clutter). Larger screens: a row.
    <div className={cn("flex flex-wrap items-center gap-3 max-sm:flex-col max-sm:items-stretch max-sm:gap-2.5 [&_a]:max-sm:h-12 [&_a]:max-sm:w-full [&_a]:max-sm:px-5 [&_a]:max-sm:text-[0.9375rem] [&>div]:max-sm:w-full", className)}>
      <Magnetic className="max-sm:m-0 max-sm:block max-sm:p-0">
        <Button href="/enquire?type=visit" size={size} arrow="right">
          Book a tour
        </Button>
      </Magnetic>
      <Button href="/pathway-explorer" variant="secondary" size={size}>
        Explore your pathway
      </Button>
      {compact ? (
        <Button href="/consultation" variant="ghost" arrow="right" className="text-[0.9375rem] max-sm:justify-center">
          Talk to an advisor
        </Button>
      ) : (
        <Button href="/consultation" variant="secondary" size={size}>
          Talk to an advisor
        </Button>
      )}
    </div>
  );
}
