import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { cn } from "@/lib/utils";

/**
 * The site's three main calls to action, always in the same order and style so a visitor learns
 * them once: Book a tour (primary, red), Explore your pathway, Talk to an advisor.
 */
export function CtaTrio({ size = "md", className, compact = false }: { size?: "sm" | "md" | "lg"; className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Magnetic>
        <Button href="/enquire?type=visit" size={size} arrow="right">
          Book a tour
        </Button>
      </Magnetic>
      <Button href="/pathway-explorer" variant="secondary" size={size}>
        Explore your pathway
      </Button>
      {compact ? (
        <Button href="/consultation" variant="ghost" arrow="right" className="text-[0.9375rem]">
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
