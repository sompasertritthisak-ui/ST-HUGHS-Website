"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Long copy on phones: shows the opening (about one screen) with a fade and a "Read more" button.
 * From `lg` up everything is shown. If the text is short, no button appears.
 */
export function ReadMore({ children, label = "Read the full description", className }: { children: ReactNode; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [needed, setNeeded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setNeeded(el.scrollHeight > el.clientHeight + 40);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={className}>
      <div
        id={id}
        ref={ref}
        className={cn("relative", !open && "max-lg:max-h-[30rem] max-lg:overflow-hidden")}
      >
        {children}
        {!open && needed ? <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent lg:hidden" /> : null}
      </div>
      {needed && !open ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-5 text-[0.9375rem] font-semibold text-fg lg:hidden"
        >
          {label}
          <ChevronDown aria-hidden className="size-4" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
