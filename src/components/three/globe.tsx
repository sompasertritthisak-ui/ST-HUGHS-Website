"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { ORIGIN, angularDistance, latLngToXYZ, rotationToFace, type GlobeDestination } from "./geo";

/**
 * The hero globe. A dark sphere with a faint gold rim, a graticule, Vientiane
 * as the single lit origin node, and great-circle arcs that draw on toward every
 * published destination. No textures, no fetches, no lights — one small shader.
 *
 * Performance: pixel ratio capped at 1.5, `frameloop` is "never" when the hero
 * is off-screen, all hand-built geometries/materials are disposed on unmount.
 */

const PALETTE = {
  midnight: "#06090F",
  navy: "#111D36",
  gold: "#C6A45C",
  goldSoft: "#E4CE93",
  platinum: "#B9BFCB",
} as const;

const R = 1;
const AUTO_ROTATE = 0.025; // rad · s⁻¹ — a full turn takes ~4 minutes
const SCROLL_ROTATE = 0.6; // extra radians across the hero's scroll range

const sphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const sphereFragment = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uBase;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float ndv = max(dot(vNormal, vView), 0.0);
    float fresnel = pow(1.0 - ndv, 3.2);
    vec3 light = normalize(vec3(-0.55, 0.65, 0.85));
    float diffuse = dot(vNormal, light) * 0.5 + 0.5;
    vec3 col = mix(uDeep, uBase, diffuse * 0.9);
    col += uRim * fresnel * 0.22;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function buildGraticule(radius: number, step = 15, segments = 96) {
  const pts: number[] = [];
  const push = (a: [number, number, number], b: [number, number, number]) => pts.push(...a, ...b);
  // parallels
  for (let lat = -90 + step; lat < 90; lat += step) {
    for (let i = 0; i < segments; i++) {
      const l0 = (i / segments) * 360 - 180;
      const l1 = ((i + 1) / segments) * 360 - 180;
      push(latLngToXYZ(lat, l0, radius), latLngToXYZ(lat, l1, radius));
    }
  }
  // meridians
  for (let lng = -180; lng < 180; lng += step) {
    for (let i = 0; i < segments / 2; i++) {
      const a0 = (i / (segments / 2)) * 180 - 90;
      const a1 = ((i + 1) / (segments / 2)) * 180 - 90;
      push(latLngToXYZ(a0, lng, radius), latLngToXYZ(a1, lng, radius));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

type Arc = {
  line: THREE.Line;
  geometry: THREE.BufferGeometry;
  material: THREE.LineBasicMaterial;
  count: number;
  delay: number;
  end: THREE.Vector3;
};

const ARC_POINTS = 96;

function buildArcs(destinations: GlobeDestination[]): Arc[] {
  const start = new THREE.Vector3(...latLngToXYZ(ORIGIN.lat, ORIGIN.lng, R + 0.004));
  return destinations.map((d, i) => {
    const end = new THREE.Vector3(...latLngToXYZ(d.lat, d.lng, R + 0.004));
    const dist = angularDistance(ORIGIN.lat, ORIGIN.lng, d.lat, d.lng);
    const lift = R + 0.12 + dist * 0.2;
    const mid = start.clone().add(end).normalize().multiplyScalar(lift);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(ARC_POINTS));
    geometry.setDrawRange(0, 0);
    const material = new THREE.LineBasicMaterial({
      color: PALETTE.gold,
      transparent: true,
      opacity: d.verified ? 0.6 : 0.32,
      depthWrite: false,
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    return { line, geometry, material, count: ARC_POINTS + 1, delay: 0.7 + i * 0.16, end };
  });
}

function Scene({ destinations, scroll }: { destinations: GlobeDestination[]; scroll?: MotionValue<number> }) {
  const spin = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const baseRotation = rotationToFace(ORIGIN.lng) - 0.45;

  const sphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sphereVertex,
        fragmentShader: sphereFragment,
        uniforms: {
          uDeep: { value: new THREE.Color(PALETTE.midnight) },
          uBase: { value: new THREE.Color(PALETTE.navy) },
          uRim: { value: new THREE.Color(PALETTE.gold) },
        },
      }),
    [],
  );
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(R, 64, 48), []);
  const graticule = useMemo(() => buildGraticule(R + 0.002), []);
  const graticuleMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: PALETTE.platinum, transparent: true, opacity: 0.075, depthWrite: false }),
    [],
  );
  const arcs = useMemo(() => buildArcs(destinations), [destinations]);

  const origin = useMemo(() => {
    const p = new THREE.Vector3(...latLngToXYZ(ORIGIN.lat, ORIGIN.lng, R + 0.003));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.clone().normalize());
    return { position: p, quaternion: q };
  }, []);

  useEffect(() => {
    return () => {
      sphereMaterial.dispose();
      sphereGeometry.dispose();
      graticule.dispose();
      graticuleMaterial.dispose();
      for (const a of arcs) {
        a.geometry.dispose();
        a.material.dispose();
      }
    };
  }, [sphereMaterial, sphereGeometry, graticule, graticuleMaterial, arcs]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spin.current) {
      spin.current.rotation.y = baseRotation + t * AUTO_ROTATE + (scroll?.get() ?? 0) * SCROLL_ROTATE;
    }
    // origin pulse ring
    if (pulse.current) {
      const phase = (t % 2.2) / 2.2;
      const s = 1 + phase * 2.4;
      pulse.current.scale.set(s, s, s);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - phase);
    }
    // arcs draw on, staggered; destination dots appear when a route arrives
    arcs.forEach((a, i) => {
      const p = Math.max(0, Math.min(1, (t - a.delay) / 1.4));
      const eased = easeOutCubic(p);
      a.geometry.setDrawRange(0, Math.max(0, Math.round(eased * a.count)));
      const dot = dots.current[i];
      if (dot) {
        const ds = p >= 1 ? Math.min(1, (t - a.delay - 1.4) / 0.4) : 0;
        dot.scale.setScalar(ds);
      }
    });
  });

  return (
    <group rotation={[0.28, 0, -0.12]}>
      <group ref={spin}>
        <mesh geometry={sphereGeometry} material={sphereMaterial} />
        <lineSegments geometry={graticule} material={graticuleMaterial} />

        {/* Vientiane — the origin */}
        <mesh position={origin.position}>
          <sphereGeometry args={[0.016, 16, 16]} />
          <meshBasicMaterial color={PALETTE.goldSoft} toneMapped={false} />
        </mesh>
        <mesh ref={pulse} position={origin.position} quaternion={origin.quaternion}>
          <ringGeometry args={[0.02, 0.0235, 48]} />
          <meshBasicMaterial color={PALETTE.gold} transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* Routes */}
        {arcs.map((a, i) => (
          <group key={destinations[i]?.slug ?? i}>
            <primitive object={a.line} dispose={null} />
            <mesh
              ref={(el) => {
                dots.current[i] = el;
              }}
              position={a.end}
              scale={0}
            >
              <sphereGeometry args={[0.011, 12, 12]} />
              <meshBasicMaterial color={destinations[i]?.verified ? PALETTE.goldSoft : PALETTE.platinum} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function Globe({ destinations, active = true, scroll }: { destinations: GlobeDestination[]; active?: boolean; scroll?: MotionValue<number> }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 3.1], fov: 38, near: 0.1, far: 10 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ background: "transparent", width: "100%", height: "100%" }}
      aria-hidden
    >
      <Scene destinations={destinations} scroll={scroll} />
    </Canvas>
  );
}
