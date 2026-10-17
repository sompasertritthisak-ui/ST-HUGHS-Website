"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GlobeDestination } from "./geo";

/**
 * Chapter scene — "Where the line leads". The red route line as a ribbon of light that curves out
 * of the foreground and arrives at a small, slowly turning Earth. The published destinations orbit
 * the Earth on a tilted ring as labels that link to their pages; three milestones sit on the line.
 * Depth fog, a soft halo and drifting dust give it depth; the camera leans with the pointer.
 * Runs only while on screen; nothing renders without WebGL or under reduced motion.
 */

const BRAND = "#CF1B18";
const SOFT = "#FF8A85";
const SPACE = "#0B1350";

const TEX = {
  day: "/textures/earth/earth_atmos_2048.jpg",
  clouds: "/textures/earth/earth_clouds_1024.png",
  lights: "/textures/earth/earth_lights_2048.png",
};

function Dust({ count = 520 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    let seed = 13;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rand() * 16;
      pos[i * 3 + 1] = rand() * 9;
      pos[i * 3 + 2] = rand() * 12 - 7;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#ffffff" size={1.8} sizeAttenuation={false} transparent opacity={0.4} depthWrite={false} />
    </points>
  );
}

/** Shared drag state: the Canvas owns the pointer, the World applies the spin. */
type Spin = { offset: number; velocity: number; dragging: boolean };

function World({ center, radius, destinations, spin }: { center: THREE.Vector3; radius: number; destinations: GlobeDestination[]; spin: Spin }) {
  const [day, clouds, lights] = useLoader(THREE.TextureLoader, [TEX.day, TEX.clouds, TEX.lights]);
  useEffect(() => {
    for (const t of [day, clouds, lights]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
    }
  }, [day, clouds, lights]);
  const earth = useRef<THREE.Mesh>(null);
  const cloud = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);
  const world = useRef<THREE.Group>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tilt = 0.42;
  const orbit = radius * 1.75;
  const n = destinations.length;

  useFrame(({ clock, camera }, delta) => {
    const d = Math.min(delta, 0.05);
    // Auto-rotation pauses while the visitor holds the globe; a flick keeps it turning, then settles.
    if (!spin.dragging) {
      spin.offset += spin.velocity * d;
      spin.velocity *= 0.94;
      if (earth.current) earth.current.rotation.y += d * 0.07;
      if (cloud.current) cloud.current.rotation.y += d * 0.09;
    }
    if (world.current) world.current.rotation.y = spin.offset;
    const t = clock.getElapsedTime() * 0.055 + spin.offset * 0.5;
    if (ring.current) {
      ring.current.children.forEach((child, i) => {
        const a = t + (i / Math.max(1, n)) * Math.PI * 2;
        child.position.set(Math.cos(a) * orbit, Math.sin(a) * orbit * Math.sin(tilt), Math.sin(a) * orbit * Math.cos(tilt));
        // Labels behind the Earth recede.
        const behind = child.position.z < -radius * 0.35;
        const el = labelRefs.current[i];
        if (el) {
          el.style.opacity = behind ? "0.28" : "1";
          el.style.transform = `translate(-50%, -50%) scale(${behind ? 0.85 : 1})`;
        }
        child.lookAt(camera.position);
      });
    }
  });

  return (
    <group position={center}>
      <group ref={world}>
      {/* atmosphere */}
      <mesh scale={1.22}>
        <sphereGeometry args={[radius, 48, 32]} />
        <meshBasicMaterial color="#5E7FF0" transparent opacity={0.16} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={earth}>
        <sphereGeometry args={[radius, 64, 48]} />
        <meshPhongMaterial map={day} emissiveMap={lights} emissive={new THREE.Color("#ffd9a3")} emissiveIntensity={0.18} specular={new THREE.Color("#4e6fc4")} shininess={12} />
      </mesh>
      <mesh ref={cloud}>
        <sphereGeometry args={[radius * 1.015, 48, 32]} />
        <meshPhongMaterial map={clouds} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* orbit guide */}
      <mesh rotation={[Math.PI / 2 - tilt, 0, 0]}>
        <ringGeometry args={[orbit - 0.004, orbit + 0.004, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      </group>
      <group ref={ring}>
        {destinations.map((dst, i) => (
          <group key={dst.slug}>
            <mesh>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshBasicMaterial color={SOFT} toneMapped={false} />
            </mesh>
            <Html
              position={[0, 0.17, 0]}
              zIndexRange={[30, 10]}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              style={{ transform: "translate(-50%, -50%)", transition: "opacity 400ms ease, transform 400ms ease" }}
            >
              <Link
                href={`/destinations/${dst.slug}`}
                className="block whitespace-nowrap rounded-full border border-white/25 bg-[#0B1350]/75 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-colors hover:border-[#FF8A85] hover:bg-[#CF1B18]"
              >
                <span className="mr-2 text-[#FF8A85]">{dst.isoCode}</span>
                {dst.country}
              </Link>
            </Html>
          </group>
        ))}
      </group>
    </group>
  );
}

const MILESTONES = [
  { t: 0.07, label: "Vientiane · Year one" },
  { t: 0.5, label: "Partner university" },
  { t: 0.88, label: "Degree abroad" },
] as const;

function Scene({ destinations, spin }: { destinations: GlobeDestination[]; spin: Spin }) {
  const { camera, pointer, viewport } = useThree();
  const wide = viewport.aspect > 1.15;
  const center = useMemo(() => new THREE.Vector3(wide ? 2.3 : 0.9, wide ? 0.9 : 1.3, -1.6), [wide]);
  const radius = wide ? 1.05 : 0.8;

  const curve = useMemo(() => {
    const end = center.clone().add(new THREE.Vector3(-radius * 0.72, -radius * 0.55, radius * 0.5));
    return new THREE.CatmullRomCurve3(
      [new THREE.Vector3(-7.5, -3.4, 3), new THREE.Vector3(-3.6, -2.2, 1.6), new THREE.Vector3(-0.8, -1.3, 0.4), new THREE.Vector3(wide ? 0.9 : 0.1, -0.5, -0.6), end],
      false,
      "catmullrom",
      0.5,
    );
  }, [center, radius, wide]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 240, 0.028, 10, false), [curve]);
  const halo = useMemo(() => new THREE.TubeGeometry(curve, 120, 0.09, 10, false), [curve]);
  const aura = useMemo(() => new THREE.TubeGeometry(curve, 80, 0.26, 8, false), [curve]);
  useEffect(
    () => () => {
      tube.dispose();
      halo.dispose();
      aura.dispose();
    },
    [tube, halo, aura],
  );
  const drawn = useRef(0);
  const packet = useRef<THREE.Mesh>(null);
  const totals = [tube, halo, aura].map((g) => (g.index ? g.index.count : 0));
  const look = useMemo(() => center.clone().add(new THREE.Vector3(wide ? -1.4 : -0.5, -0.6, 0)), [center, wide]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    drawn.current = Math.min(1, drawn.current + delta / 2.6);
    const eased = 1 - Math.pow(1 - drawn.current, 3);
    tube.setDrawRange(0, Math.floor(totals[0] * eased));
    halo.setDrawRange(0, Math.floor(totals[1] * eased));
    aura.setDrawRange(0, Math.floor(totals[2] * eased));
    if (packet.current) {
      const frac = (t * 0.065) % 1;
      curve.getPoint(Math.min(frac, eased), packet.current.position);
      packet.current.visible = eased > 0.05;
    }
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (0.3 + pointer.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(look);
  });

  const milestonePositions = useMemo(() => MILESTONES.map((m) => curve.getPoint(m.t)), [curve]);

  return (
    <>
      <fog attach="fog" args={[SPACE, 5, 17]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[-3, 3, 5]} intensity={2.6} />
      <Dust />

      <mesh geometry={aura}>
        <meshBasicMaterial color={BRAND} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh geometry={halo}>
        <meshBasicMaterial color={BRAND} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh geometry={tube}>
        <meshBasicMaterial color={SOFT} toneMapped={false} />
      </mesh>
      <mesh ref={packet} visible={false}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {MILESTONES.map((m, i) => (
        <group key={m.label} position={milestonePositions[i]}>
          <mesh>
            <sphereGeometry args={[0.07, 20, 20]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.17, 16, 16]} />
            <meshBasicMaterial color={BRAND} transparent opacity={0.22} depthWrite={false} toneMapped={false} />
          </mesh>
          <Html position={[0, 0.3, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <span className="whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.16em] text-white/85">
              <span className="mr-2 text-[#FF8A85]">{String(i + 1).padStart(2, "0")}</span>
              {m.label}
            </span>
          </Html>
        </group>
      ))}

      <World center={center} radius={radius} destinations={destinations} spin={spin} />
    </>
  );
}

export function RouteRibbon({ destinations, className }: { destinations: GlobeDestination[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [ok, setOk] = useState(false);
  const spin = useRef<Spin>({ offset: 0, velocity: 0, dragging: false }).current;
  const drag = useRef<{ x: number; last: number; t: number } | null>(null);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a")) return; // let destination links click through
    drag.current = { x: e.clientX, last: e.clientX, t: performance.now() };
    spin.dragging = true;
    spin.velocity = 0;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = "grabbing";
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.last;
    const now = performance.now();
    spin.offset += dx * 0.008;
    spin.velocity = (dx * 0.008) / Math.max(0.016, (now - d.t) / 1000);
    d.last = e.clientX;
    d.t = now;
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    spin.dragging = false;
    spin.velocity = Math.max(-6, Math.min(6, spin.velocity));
    e.currentTarget.style.cursor = "grab";
  };

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
    <div ref={ref} className={className} aria-hidden onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ cursor: "grab", touchAction: "pan-y" }}>
      {ok ? (
        <Canvas
          dpr={[1, 1.5]}
          frameloop={active ? "always" : "never"}
          camera={{ position: [0, 0.3, 6.6], fov: 42, near: 0.1, far: 60 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent", width: "100%", height: "100%" }}
        >
          <Scene destinations={destinations} spin={spin} />
        </Canvas>
      ) : null}
    </div>
  );
}
