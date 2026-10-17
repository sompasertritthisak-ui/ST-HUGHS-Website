"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GlobeDestination } from "./geo";

/**
 * Chapter scene — "Where the line leads". The red route line as a ribbon in deep space: it draws
 * itself from the near foreground up and away into depth, a packet of light travels along it, four
 * milestones sit on the line, and the published destinations float around its far end as labels
 * that link to their pages. The camera leans gently with the pointer. Frame loop runs only while
 * the scene is on screen.
 */

const BRAND = "#CF1B18";
const SOFT = "#FF8A85";

const MILESTONES = [
  { t: 0.06, label: "Vientiane · Year one" },
  { t: 0.42, label: "Partner university" },
  { t: 0.7, label: "Degree" },
  { t: 0.96, label: "Career, anywhere" },
] as const;

function Dust({ count = 420 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rand() * 14;
      pos[i * 3 + 1] = rand() * 8;
      pos[i * 3 + 2] = rand() * 10 - 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012;
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} transparent opacity={0.35} depthWrite={false} />
    </points>
  );
}

function Scene({ destinations }: { destinations: GlobeDestination[] }) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [new THREE.Vector3(-6.5, -2.8, 2.2), new THREE.Vector3(-2.4, -1.2, 0.6), new THREE.Vector3(0.6, 0.3, -1.4), new THREE.Vector3(3.6, 1.6, -3.8), new THREE.Vector3(7.5, 3.1, -7.5)],
        false,
        "catmullrom",
        0.6,
      ),
    [],
  );
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 260, 0.03, 10, false), [curve]);
  const halo = useMemo(() => new THREE.TubeGeometry(curve, 120, 0.1, 10, false), [curve]);
  useEffect(
    () => () => {
      tube.dispose();
      halo.dispose();
    },
    [tube, halo],
  );
  const packet = useRef<THREE.Mesh>(null);
  const chips = useRef<THREE.Group>(null);
  const drawn = useRef(0);
  const { camera, pointer } = useThree();
  const total = tube.index ? tube.index.count : 0;
  const haloTotal = halo.index ? halo.index.count : 0;
  const target = useMemo(() => new THREE.Vector3(0.6, 0.4, -2), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    // draw-on over ~2.4 s
    drawn.current = Math.min(1, drawn.current + delta / 2.4);
    const eased = 1 - Math.pow(1 - drawn.current, 3);
    tube.setDrawRange(0, Math.floor(total * eased));
    halo.setDrawRange(0, Math.floor(haloTotal * eased));
    if (packet.current) {
      const frac = (t * 0.07) % 1;
      curve.getPoint(Math.min(frac, eased), packet.current.position);
      packet.current.visible = eased > 0.05;
    }
    if (chips.current) chips.current.position.y = Math.sin(t * 0.6) * 0.06;
    // pointer parallax
    camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.04;
    camera.position.y += (0.6 + pointer.y * 0.45 - camera.position.y) * 0.04;
    camera.lookAt(target);
  });

  const milestonePositions = useMemo(() => MILESTONES.map((m) => curve.getPoint(m.t)), [curve]);
  // Destinations float above the far half of the ribbon in three staggered rows, so none falls
  // into the copy area at the bottom-left and neighbours never overlap.
  const chipPositions = useMemo(
    () =>
      destinations.map((_, i) => {
        const n = Math.max(1, destinations.length - 1);
        const t = 0.4 + (i / n) * 0.56;
        const p = curve.getPoint(t);
        const row = i % 3;
        return new THREE.Vector3(p.x - 0.9 + row * 0.35, p.y + 0.9 + row * 0.62, p.z + 0.3);
      }),
    [curve, destinations],
  );

  return (
    <>
      <Dust />
      <mesh geometry={halo}>
        <meshBasicMaterial color={BRAND} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh geometry={tube}>
        <meshBasicMaterial color={BRAND} toneMapped={false} />
      </mesh>
      <mesh ref={packet} visible={false}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={SOFT} toneMapped={false} />
      </mesh>

      {MILESTONES.map((m, i) => (
        <group key={m.label} position={milestonePositions[i]}>
          <mesh>
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshBasicMaterial color={BRAND} transparent opacity={0.25} depthWrite={false} toneMapped={false} />
          </mesh>
          <Html position={[0, 0.26, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <span className="whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.16em] text-white/85">
              <span className="mr-2 text-[#FF8A85]">{String(i + 1).padStart(2, "0")}</span>
              {m.label}
            </span>
          </Html>
        </group>
      ))}

      <group ref={chips}>
        {destinations.map((d, i) => (
          <group key={d.slug} position={chipPositions[i]}>
            <mesh>
              <sphereGeometry args={[0.03, 10, 10]} />
              <meshBasicMaterial color={SOFT} toneMapped={false} />
            </mesh>
            <Html position={[0, 0.18, 0]} center zIndexRange={[30, 10]}>
              <Link
                href={`/destinations/${d.slug}`}
                className="whitespace-nowrap rounded-full border border-white/25 bg-[#0B1350]/70 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-colors hover:border-[#FF8A85] hover:bg-[#CF1B18]"
              >
                <span className="mr-2 text-[#FF8A85]">{d.isoCode}</span>
                {d.country}
              </Link>
            </Html>
          </group>
        ))}
      </group>
    </>
  );
}

export function RouteRibbon({ destinations, className }: { destinations: GlobeDestination[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") ?? c.getContext("webgl"))) return;
    } catch {
      return;
    }
    setOk(true);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => setActive(e.isIntersecting)), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} aria-hidden>
      {ok ? (
        <Canvas dpr={[1, 1.5]} frameloop={active ? "always" : "never"} camera={{ position: [0, 0.6, 6], fov: 42, near: 0.1, far: 60 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} style={{ background: "transparent", width: "100%", height: "100%" }}>
          <Scene destinations={destinations} />
        </Canvas>
      ) : null}
    </div>
  );
}
