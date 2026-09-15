"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The gold route line as page progress: a 1px line across the top that draws
 * on route change and then tracks scroll depth. The memory motif of the site.
 */
export function ProgressLine() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-px">
      <div
        className="h-full origin-left bg-route shadow-[0_0_8px_var(--route)] transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)]"
        style={{ transform: `scaleX(${loading ? 0.35 : Math.max(0.02, progress)})` }}
      />
    </div>
  );
}
