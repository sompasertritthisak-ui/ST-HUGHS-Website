"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/**
 * Chapter scene — "A year at home, lived fully". Real St Hugh's photographs float as panes at
 * different depths, each drifting gently and leaning toward the viewer, while the red route line
 * threads between them and a point of light travels along it. Pointer parallax moves the near
 * panes more than the far ones. Runs only while on screen; nothing renders without WebGL or under
 * reduced motion.
 */

const BRAND = "#CF1B18";
const SOFT = "#FF8A85";
const SPACE = "#0B1350";

type Pane = { src: string; position: [number, number, number]; size: [number, number]; phase: number; label: string };

const PANES: Pane[] = [
  { src: "/media/students/Class_1.jpg", position: [-2.5, 0.25, -0.6], size: [3.4, 2.1], phase: 0, label: "Seminar room" },
  { src: "/media/students/shv-classroom-teacher.jpg", position: [1.9, -0.55, -2.2], size: [3.8, 2.35], phase: 2.1, label: "Teaching" },
  { src: "/media/campus/shv-campus-entrance.jpg", position: [0.3, 1.9, -4.4], size: [4.6, 2.2], phase: 4.2, label: "Campus · Vientiane" },
  { src: "/media/partners/shv-assumption-partnership-signing.jpg", position: [-3.4, -1.9, -3.2], size: [3.2, 2.0], phase: 1.2, label: "Partners" },
];

function Dust({ count = 420 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    let seed = 29;
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
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} transparent opacity={0.35} depthWrite={false} />
    </points>
  );
}

function PhotoPane({ pane, texture, pointer }: { pane: Pane; texture: THREE.Texture; pointer: THREE.Vector2 }) {
  const group = useRef<THREE.Group>(null);
  const depth = 1 / (1 + Math.abs(pane.position[2]) * 0.35); // near panes move more
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.position.x = pane.position[0] + pointer.x * 0.35 * depth;
    g.position.y = pane.position[1] + Math.sin(t * 0.5 + pane.phase) * 0.08 + pointer.y * 0.25 * depth;
    g.rotation.y = -pointer.x * 0.08 + Math.sin(t * 0.3 + pane.phase) * 0.03;
    g.rotation.x = pointer.y * 0.06;
  });
  const [w, h] = pane.size;
  return (
    <group ref={group} position={pane.position}>
      {/* frame */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[w + 0.08, h + 0.08]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.14} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* red rule, as on the plates in the site */}
      <mesh position={[-w / 2 + 0.3, -h / 2 + 0.16, 0.01]}>
        <planeGeometry args={[0.5, 0.02]} />
        <meshBasicMaterial color={BRAND} toneMapped={false} />
      </mesh>
      <Html position={[-w / 2 + 0.6, -h / 2 + 0.16, 0.02]} zIndexRange={[20, 0]} style={{ pointerEvents: "none", transform: "translate(0, -50%)" }}>
        <span className="whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.16em] text-white/90">{pane.label}</span>
      </Html>
    </group>
  );
}

function Scene() {
  const { camera, pointer, viewport } = useThree();
  const textures = useLoader(THREE.TextureLoader, PANES.map((p) => p.src));
  useEffect(() => {
    for (const t of textures) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
    }
  }, [textures]);
  const wide = viewport.aspect > 1.15;
  const smooth = useMemo(() => new THREE.Vector2(), []);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [new THREE.Vector3(-7, -3.6, 2.5), new THREE.Vector3(-3.2, -1.2, 0.3), new THREE.Vector3(-0.4, -0.9, -1.4), new THREE.Vector3(2.2, 0.9, -3.4), new THREE.Vector3(5.5, 3.2, -6.5)],
        false,
        "catmullrom",
        0.5,
      ),
    [],
  );
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.026, 10, false), [curve]);
  const halo = useMemo(() => new THREE.TubeGeometry(curve, 110, 0.09, 10, false), [curve]);
  useEffect(
    () => () => {
      tube.dispose();
      halo.dispose();
    },
    [tube, halo],
  );
  const drawn = useRef(0);
  const packet = useRef<THREE.Mesh>(null);
  const totals = [tube.index?.count ?? 0, halo.index?.count ?? 0];

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    smooth.x += (pointer.x - smooth.x) * 0.05;
    smooth.y += (pointer.y - smooth.y) * 0.05;
    drawn.current = Math.min(1, drawn.current + delta / 2.4);
    const eased = 1 - Math.pow(1 - drawn.current, 3);
    tube.setDrawRange(0, Math.floor(totals[0] * eased));
    halo.setDrawRange(0, Math.floor(totals[1] * eased));
    if (packet.current) {
      curve.getPoint(Math.min((t * 0.06) % 1, eased), packet.current.position);
      packet.current.visible = eased > 0.05;
    }
    camera.position.x += (smooth.x * 0.3 - camera.position.x) * 0.05;
    camera.position.y += (0.2 + smooth.y * 0.2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0.2, -2);
  });

  const scale = wide ? 1 : 0.72;
  return (
    <>
      <fog attach="fog" args={[SPACE, 6, 16]} />
      <Dust />
      <group scale={scale} position={[wide ? 0 : 0.2, wide ? 0 : 0.6, 0]}>
        <mesh geometry={halo}>
          <meshBasicMaterial color={BRAND} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh geometry={tube}>
          <meshBasicMaterial color={SOFT} toneMapped={false} />
        </mesh>
        <mesh ref={packet} visible={false}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        {PANES.map((p, i) => (
          <PhotoPane key={p.src} pane={p} texture={textures[i]} pointer={smooth} />
        ))}
        {/* origin marker */}
        <group position={[-3.2, -1.2, 0.3]}>
          <mesh>
            <sphereGeometry args={[0.07, 20, 20]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.17, 16, 16]} />
            <meshBasicMaterial color={BRAND} transparent opacity={0.22} depthWrite={false} toneMapped={false} />
          </mesh>
          <Html position={[0, -0.3, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <span className="whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.16em] text-white/85">
              <span className="mr-2 text-[#FF8A85]">Origin</span>Vientiane · 17.98° N
            </span>
          </Html>
        </group>
      </group>
    </>
  );
}

export function CampusLayers({ className }: { className?: string }) {
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
        <Canvas dpr={[1, 1.5]} frameloop={active ? "always" : "never"} camera={{ position: [0, 0.2, 6.4], fov: 42, near: 0.1, far: 60 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} style={{ background: "transparent", width: "100%", height: "100%" }}>
          <Scene />
        </Canvas>
      ) : null}
    </div>
  );
}
