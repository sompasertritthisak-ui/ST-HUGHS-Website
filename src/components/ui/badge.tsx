import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "gold" | "success" | "warning" | "danger" | "accent";

const tones: Record<Tone, string> = {
  neutral: "border-line-strong text-fg-muted",
  gold: "border-gold/50 text-gold-soft",
  success: "border-success/50 text-success",
  warning: "border-warning/60 text-warning",
  danger: "border-danger/60 text-danger",
  accent: "border-accent/60 text-accent",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em]", tones[tone], className)}>
      {children}
    </span>
  );
}
