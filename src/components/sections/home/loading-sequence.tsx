"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "shv:intro-seen";
const TOTAL_MS = 900;

/**
 * Brand reveal on first visit per session: the gold route line draws across,
 * the two hero lines appear, then the whole plate dissolves. ≤ 900ms total,
 * pure CSS, pointer-events none — it never blocks the page beneath it.
 *
 * The overlay is server-rendered so it is present on first paint. An inline
 * script (runs before paint, before hydration) hides it for repeat visitors and
 * for prefers-reduced-motion, so those users never see a flash.
 */
export function LoadingSequence({ line1, line2 }: { line1: string; line2: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = document.getElementById("shv-intro");
    if (!el || el.hidden) {
      setDone(true);
      return;
    }
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* private mode — show once anyway */
    }
    const t = window.setTimeout(() => setDone(true), TOTAL_MS + 120);
    return () => window.clearTimeout(t);
  }, []);

  if (done) return null;

  const guard = `(function(){try{var e=document.getElementById("shv-intro");if(!e)return;if(sessionStorage.getItem("${SESSION_KEY}")||window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.hidden=true;e.style.display="none";}}catch(_){}})();`;

  return (
    <>
      <style>{`
        @keyframes shv-intro-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes shv-intro-word { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes shv-intro-out { from { opacity: 1; visibility: visible; } to { opacity: 0; visibility: hidden; } }
        #shv-intro { animation: shv-intro-out 250ms var(--ease-out) 650ms both; }
        #shv-intro .shv-intro-line { transform-origin: left center; animation: shv-intro-line 450ms var(--ease-out) both; }
        #shv-intro .shv-intro-w1 { animation: shv-intro-word 320ms var(--ease-out) 150ms both; }
        #shv-intro .shv-intro-w2 { animation: shv-intro-word 320ms var(--ease-out) 380ms both; }
      `}</style>
      <div
        id="shv-intro"
        suppressHydrationWarning
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[90] flex flex-col items-center justify-center bg-bg"
      >
        <div className="container-x flex w-full max-w-[880px] flex-col gap-6">
          <div className="shv-intro-line h-px w-full bg-route" />
          <p className="font-display flex flex-wrap items-baseline gap-x-[0.35em] text-[clamp(2rem,5vw,4rem)] leading-none text-fg">
            <span className="shv-intro-w1 inline-block">{line1}</span>
            <span className="shv-intro-w2 inline-block text-gold-soft">{line2}</span>
          </p>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: guard }} />
    </>
  );
}
