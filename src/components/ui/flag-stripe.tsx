import { cn } from "@/lib/utils";

/**
 * The Lao flag as a 6px rule — red · blue · red. Placed where a white band meets a
 * deep-blue one so the brand's three colours sit together at every transition.
 */
export function FlagStripe({ className }: { className?: string }) {
  return <span aria-hidden className={cn("flag-stripe", className)} />;
}
