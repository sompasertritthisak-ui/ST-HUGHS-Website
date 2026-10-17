"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Optional ambient sound for the homepage: a soft synthesised pad (two detuned low tones through a
 * slow filter, plus a whisper of filtered noise), generated in the browser so no audio file is
 * shipped. OFF by default, never autoplays, remembered per visitor, hidden under reduced motion.
 */
export function AmbientToggle() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setReady(true);
    return () => {
      ctx.current?.close().catch(() => undefined);
    };
  }, []);

  const start = async () => {
    if (!ctx.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      const out = ac.createGain();
      out.gain.value = 0;
      out.connect(ac.destination);
      const filter = ac.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 420;
      filter.Q.value = 0.6;
      filter.connect(out);
      for (const [freq, detune, gain] of [
        [55, 0, 0.22],
        [82.41, 6, 0.14],
        [110, -5, 0.1],
        [164.81, 3, 0.05],
      ] as const) {
        const o = ac.createOscillator();
        o.type = "sine";
        o.frequency.value = freq;
        o.detune.value = detune;
        const g = ac.createGain();
        g.gain.value = gain;
        o.connect(g).connect(filter);
        o.start();
      }
      // slow breathing on the filter
      const lfo = ac.createOscillator();
      lfo.frequency.value = 0.05;
      const lfoGain = ac.createGain();
      lfoGain.gain.value = 160;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
      // air
      const len = ac.sampleRate * 2;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const noise = ac.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      const nf = ac.createBiquadFilter();
      nf.type = "bandpass";
      nf.frequency.value = 900;
      nf.Q.value = 0.4;
      const ng = ac.createGain();
      ng.gain.value = 0.015;
      noise.connect(nf).connect(ng).connect(out);
      noise.start();
      ctx.current = ac;
      master.current = out;
    }
    await ctx.current.resume();
    master.current!.gain.cancelScheduledValues(ctx.current.currentTime);
    master.current!.gain.linearRampToValueAtTime(0.28, ctx.current.currentTime + 2.5);
  };
  const stop = () => {
    if (!ctx.current || !master.current) return;
    master.current.gain.cancelScheduledValues(ctx.current.currentTime);
    master.current.gain.linearRampToValueAtTime(0, ctx.current.currentTime + 1.2);
  };

  if (!ready) return null;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Turn ambient sound off" : "Turn ambient sound on"}
      onClick={() => {
        const next = !on;
        setOn(next);
        if (next) void start();
        else stop();
      }}
      className="theme-light fixed bottom-5 right-5 z-40 hidden size-11 items-center justify-center rounded-full border border-line bg-bg/90 text-fg shadow-sm backdrop-blur-md transition-colors hover:border-blue hover:text-blue md:inline-flex"
    >
      {on ? <Volume2 className="size-4" strokeWidth={1.75} aria-hidden /> : <VolumeX className="size-4" strokeWidth={1.75} aria-hidden />}
    </button>
  );
}
