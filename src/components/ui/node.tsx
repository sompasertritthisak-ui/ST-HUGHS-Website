import { cn } from "@/lib/utils";

/** A place or step marker. Active nodes carry the pulse ring. */
export function Node({ active = false, className, size = "md" }: { active?: boolean; className?: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "size-1.5" : size === "lg" ? "size-3" : "size-2";
  return (
    <span aria-hidden className={cn("relative inline-flex items-center justify-center", size === "lg" ? "size-8" : "size-6", className)}>
      {active && <span className="absolute inset-0 rounded-full border border-route/70 motion-safe:animate-[pulse-ring_1.8s_var(--ease-out)_infinite]" />}
      <span className={cn("rounded-full", dim, active ? "bg-route shadow-[0_0_12px_var(--route)]" : "bg-fg-subtle")} />
    </span>
  );
}
