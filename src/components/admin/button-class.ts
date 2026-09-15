import { cn } from "@/lib/utils";

/** Shared admin button classes. Server-safe (no "use client") so RSC pages can call it. */
export function buttonClass(variant: "primary" | "secondary" | "danger" | "ghost" = "secondary", size: "sm" | "md" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] font-medium transition-colors duration-[var(--dur-fast)] disabled:pointer-events-none disabled:opacity-50",
    size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-[0.9375rem]",
    variant === "primary" && "bg-ink text-ivory hover:bg-navy-2",
    variant === "secondary" && "border border-line-strong text-fg hover:bg-bg-hover",
    variant === "danger" && "border border-danger/60 text-danger hover:bg-danger/10",
    variant === "ghost" && "text-fg-muted hover:bg-bg-hover hover:text-fg",
  );
}
