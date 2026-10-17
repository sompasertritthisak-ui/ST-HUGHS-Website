"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Magnetic pull for a primary call to action: within its padding zone the button leans a few
 * pixels toward the pointer and springs back on leave. Mouse only; inert on touch and under
 * reduced motion (the `.magnetic` rule is gated in CSS).
 */
export function Magnetic({ children, className, strength = 0.28 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.setProperty("--mx", `${(dx * strength).toFixed(1)}px`);
    el.style.setProperty("--my", `${(dy * strength).toFixed(1)}px`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mx", "0px");
    el.style.setProperty("--my", "0px");
  };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={cn("magnetic inline-block p-3 -m-3", className)}>
      <div className="magnetic-inner">{children}</div>
    </div>
  );
}
