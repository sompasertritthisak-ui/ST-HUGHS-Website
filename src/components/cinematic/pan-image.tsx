"use client";

import { useRef } from "react";

/** A photograph the visitor can hold and drag to look around, with inertia. Fills its parent. */
export function PanImage({ src, alt = "" }: { src: string; alt?: string }) {
  const img = useRef<HTMLImageElement>(null);
  const s = useRef({ x: 50, v: 0, dragging: false, last: 0, raf: 0 });
  const apply = () => {
    const el = img.current;
    const st = s.current;
    if (!el) return;
    if (!st.dragging) {
      st.x = Math.max(10, Math.min(90, st.x + st.v));
      st.v *= 0.92;
    }
    el.style.objectPosition = `${st.x.toFixed(2)}% 50%`;
    st.raf = st.dragging || Math.abs(st.v) > 0.01 ? requestAnimationFrame(apply) : 0;
  };
  return (
    <div
      className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => {
        s.current.dragging = true;
        s.current.last = e.clientX;
        s.current.v = 0;
        e.currentTarget.setPointerCapture(e.pointerId);
        if (!s.current.raf) s.current.raf = requestAnimationFrame(apply);
      }}
      onPointerMove={(e) => {
        const st = s.current;
        if (!st.dragging) return;
        const step = (-(e.clientX - st.last) / e.currentTarget.clientWidth) * 60;
        st.last = e.clientX;
        st.x = Math.max(10, Math.min(90, st.x + step));
        st.v = step;
      }}
      onPointerUp={() => {
        s.current.dragging = false;
      }}
      onPointerCancel={() => {
        s.current.dragging = false;
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={src} alt={alt} className="absolute inset-0 size-full object-cover" style={{ objectPosition: "50% 50%" }} draggable={false} />
      <span className="pointer-events-none absolute bottom-5 right-5 hidden font-mono text-[0.625rem] uppercase tracking-[0.16em] text-white/80 md:block">Hold and drag to look around</span>
    </div>
  );
}
