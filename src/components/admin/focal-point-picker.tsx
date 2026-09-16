"use client";

import { useState } from "react";

/** Click on the image to set the focal point (0–1). Writes hidden focalX/focalY inputs. */
export function FocalPointPicker({ url, alt, initialX, initialY, disabled }: { url: string; alt: string; initialX: number; initialY: number; disabled?: boolean }) {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  return (
    <div>
      <input type="hidden" name="focalX" value={x.toFixed(3)} />
      <input type="hidden" name="focalY" value={y.toFixed(3)} />
      <button
        type="button"
        disabled={disabled}
        aria-label={`Focal point at ${Math.round(x * 100)}% across, ${Math.round(y * 100)}% down. Click to move.`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setX(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
          setY(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
        }}
        onKeyDown={(e) => {
          const step = 0.02;
          if (e.key === "ArrowLeft") setX((v) => Math.max(0, v - step));
          if (e.key === "ArrowRight") setX((v) => Math.min(1, v + step));
          if (e.key === "ArrowUp") setY((v) => Math.max(0, v - step));
          if (e.key === "ArrowDown") setY((v) => Math.min(1, v + step));
        }}
        className="relative block w-full max-w-xl cursor-crosshair overflow-hidden rounded-[var(--radius)] border border-line bg-bg-hover focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-default"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local upload, intrinsic size unknown */}
        <img src={url} alt={alt} className="block max-h-[28rem] w-full object-contain" draggable={false} />
        <span aria-hidden className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand shadow-[0_0_0_2px_rgb(11_17_32/0.5)]" style={{ left: `${x * 100}%`, top: `${y * 100}%` }} />
      </button>
      <p className="mt-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-subtle">
        Focal point {Math.round(x * 100)}% / {Math.round(y * 100)}% · click or use arrow keys
      </p>
    </div>
  );
}
