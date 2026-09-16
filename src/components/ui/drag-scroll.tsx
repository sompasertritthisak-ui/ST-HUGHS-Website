"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Horizontal strip with pointer drag-to-scroll, arrow keys, and a red progress
 * line. Wraps native overflow scrolling so touch and scroll-snap keep working.
 */
export function DragScroll({ children, className, ariaLabel }: { children: ReactNode; className?: string; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    ref.current.scrollLeft = drag.current.left - dx;
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    // swallow the click that ends a drag so links are not followed accidentally
    if (drag.current?.moved) e.preventDefault();
  };

  return (
    <div className={className}>
      <div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        onKeyDown={(e) => {
          if (!ref.current) return;
          if (e.key === "ArrowRight") ref.current.scrollBy({ left: 320, behavior: "smooth" });
          if (e.key === "ArrowLeft") ref.current.scrollBy({ left: -320, behavior: "smooth" });
        }}
        className={cn(
          "flex snap-x gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-8 focus-visible:outline-none",
          dragging ? "cursor-grabbing snap-none select-none" : "cursor-grab snap-mandatory",
        )}
      >
        {children}
      </div>
      <div aria-hidden className="container-x mt-4">
        <div className="relative h-px w-full bg-line">
          <span className="absolute inset-y-0 left-0 bg-route transition-[width] duration-150" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
