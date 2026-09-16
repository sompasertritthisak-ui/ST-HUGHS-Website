"use client";

import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { ORIGIN, angularDistance, latLngToXYZ, type GlobeDestination } from "./geo";
import { LAND_DOTS } from "./data/land-dots";

/**
 * The hero globe — the site's WOW moment.
 *
 * A deep-blue sphere carrying the world as a cloud of white land dots, a soft
 * blue atmosphere, a sparse still star field, Vientiane as the red pulsing
 * origin, red great-circle routes with travelling packets, and labelled,
 * clickable destination nodes. Drag to turn; it turns itself when left alone.
 *
 * No textures, no fetches, no lights, no shadows, no postprocessing. Pixel
 * ratio is capped (1.5 high tier / 1 low tier), the frame loop is paused when
 * the hero is off-screen, and every hand-built resource is disposed on unmount.
 */

export type GlobeTier = "high" | "low";

const PALETTE = {
  midnight: "#0B1350",
  navy: "#142478",
  brand: "#CF1B18",
  brandSoft: "#FF8E8B",
  platinum: "#C7D1EC",
  white: "#FFFFFF",
  haze: "#3352C9", // atmosphere — brand blue, lifted for an additive glow
} as const;

const R = 1;
const CAMERA_DISTANCE = 3.1;
const SCROLL_ROTATE = 0.5; // radians of extra turn across the hero's scroll range
/** Auto-rotation, same semantics as OrbitControls autoRotateSpeed 0.6 (0.6 × 2π/60 rad·s⁻¹ ≈ 100 s per turn). */
const AUTO_ROTATE = (0.6 * Math.PI * 2) / 60;
/** Frame delta clamp so a throttled/background tab never applies minutes of rotation in one frame. */
const MAX_DELTA = 0.05;
const ARC_POINTS = 96;
const ARC_DRAW_SECONDS = 1.4;

/** Initial camera: Southeast Asia facing the viewer, Vientiane a little left of centre. */
const CAMERA_START = latLngToXYZ(18, ORIGIN.lng + 24, CAMERA_DISTANCE);

// ── Shaders ──────────────────────────────────────────────────────────────────

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
    float fresnel = pow(1.0 - ndv, 3.4);
    vec3 light = normalize(vec3(-0.5, 0.6, 0.85));
    float diffuse = dot(vNormal, light) * 0.5 + 0.5;
    vec3 col = mix(uDeep, uBase, diffuse * 0.85);
    col += uRim * fresnel * 0.16;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // Back faces of a shell: the visible band sits just outside the globe's silhouette.
    float rim = -dot(vNormal, vView);
    float i = pow(smoothstep(0.0, 0.62, rim), 1.7);
    gl_FragColor = vec4(uColor * i, i * 0.85);
    #include <colorspace_fragment>
  }
`;

const dotsVertex = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vFacing;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFacing = clamp(dot(n, normalize(-mv.xyz)), 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (3.0 / -mv.z);
  }
`;

const dotsFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vFacing;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.28, d);
    float alpha = 0.55 * (0.5 + 0.5 * vFacing) * edge;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

// ── Geometry builders ────────────────────────────────────────────────────────

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function buildGraticule(radius: number, step = 30, segments = 72) {
  const pts: number[] = [];
  const push = (a: [number, number, number], b: [number, number, number]) => pts.push(...a, ...b);
  for (let lat = -90 + step; lat < 90; lat += step) {
    for (let i = 0; i < segments; i++) {
      push(latLngToXYZ(lat, (i / segments) * 360 - 180, radius), latLngToXYZ(lat, ((i + 1) / segments) * 360 - 180, radius));
    }
  }
  for (let lng = -180; lng < 180; lng += step) {
    for (let i = 0; i < segments / 2; i++) {
      push(latLngToXYZ((i / (segments / 2)) * 180 - 90, lng, radius), latLngToXYZ(((i + 1) / (segments / 2)) * 180 - 90, lng, radius));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

/** Natural Earth land as points on the sphere. `step` subsamples for the low tier. */
function buildLandDots(step: number) {
  const count = Math.ceil(LAND_DOTS.length / 2 / step);
  const pos = new Float32Array(count * 3);
  let j = 0;
  for (let i = 0; i + 1 < LAND_DOTS.length; i += 2 * step) {
    const [x, y, z] = latLngToXYZ(LAND_DOTS[i] / 100, LAND_DOTS[i + 1] / 100, R + 0.004);
    pos[j++] = x;
    pos[j++] = y;
    pos[j++] = z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos.subarray(0, j), 3));
  return geo;
}

/** Deterministic sparse star field, far behind the globe. Never moves. */
function buildStars(count: number) {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const t = rand() * Math.PI * 2;
    const r = 9 + rand() * 4;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = r * s * Math.cos(t);
    pos[i * 3 + 1] = r * u;
    pos[i * 3 + 2] = r * s * Math.sin(t);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return geo;
}

type Arc = {
  curve: THREE.QuadraticBezierCurve3;
  line: THREE.Line;
  geometry: THREE.BufferGeometry;
  material: THREE.LineBasicMaterial;
  baseOpacity: number;
  delay: number;
  end: THREE.Vector3;
};

function buildArcs(destinations: GlobeDestination[]): Arc[] {
  const start = new THREE.Vector3(...latLngToXYZ(ORIGIN.lat, ORIGIN.lng, R + 0.006));
  return destinations.map((d, i) => {
    const end = new THREE.Vector3(...latLngToXYZ(d.lat, d.lng, R + 0.006));
    const dist = angularDistance(ORIGIN.lat, ORIGIN.lng, d.lat, d.lng);
    const mid = start.clone().add(end).normalize().multiplyScalar(R + 0.1 + dist * 0.2);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(ARC_POINTS));
    geometry.setDrawRange(0, 0);
    const baseOpacity = d.verified ? 0.85 : 0.5;
    const material = new THREE.LineBasicMaterial({ color: PALETTE.brand, transparent: true, opacity: baseOpacity, depthWrite: false });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    line.renderOrder = 2;
    return { curve, line, geometry, material, baseOpacity, delay: 0.8 + i * 0.16, end };
  });
}

// ── Scene parts ──────────────────────────────────────────────────────────────

const _world = new THREE.Vector3();
const _cam = new THREE.Vector3();

function DestinationNode({
  destination,
  position,
  appearAt,
  onSelect,
  onHover,
}: {
  destination: GlobeDestination;
  position: THREE.Vector3;
  appearAt: number;
  onSelect: (slug: string) => void;
  onHover: (hovering: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const label = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const gl = useThree((s) => s.gl);

  useFrame(({ camera, clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const appear = Math.max(0, Math.min(1, (t - appearAt) / 0.45));
    g.getWorldPosition(_world).normalize();
    _cam.copy(camera.position).normalize();
    const facing = _world.dot(_cam);
    if (core.current) {
      const target = appear * (hover ? 1.9 : 1);
      core.current.scale.setScalar(THREE.MathUtils.lerp(core.current.scale.x, target, 0.16));
    }
    if (label.current) {
      const front = facing > 0.18 ? THREE.MathUtils.smoothstep(facing, 0.18, 0.45) : 0;
      const o = appear * front * (hover ? 1 : 0.78);
      label.current.style.opacity = o.toFixed(3);
      label.current.style.visibility = o < 0.02 ? "hidden" : "visible";
    }
  });

  const setCursor = (c: string) => {
    gl.domElement.style.cursor = c;
  };

  return (
    <group ref={group} position={position}>
      <group ref={core} scale={0}>
        <mesh>
          <sphereGeometry args={[0.014, 16, 16]} />
          <meshBasicMaterial color={destination.verified ? PALETTE.brandSoft : PALETTE.platinum} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color={PALETTE.brand} transparent opacity={hover ? 0.28 : 0.14} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      {/* Generous hit target — fully transparent but visible so it is always raycast */}
      <mesh
        renderOrder={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          onHover(true);
          setCursor("pointer");
        }}
        onPointerOut={() => {
          setHover(false);
          onHover(false);
          setCursor("grab");
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(destination.slug);
        }}
      >
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* drei only applies `pointerEvents` in transform mode; in screen-space mode set it via style + wrapperClass */}
      <Html position={[0, 0.03, 0]} wrapperClass="pointer-events-none" zIndexRange={[30, 10]} style={{ opacity: 0, visibility: "hidden", pointerEvents: "none" }} ref={label}>
        <div
          className={`whitespace-nowrap rounded-[var(--radius-sm)] border px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] backdrop-blur-sm transition-colors duration-[var(--dur-fast)] ${
            hover ? "border-brand/70 bg-bg/85 text-fg" : "border-line bg-bg/60 text-fg-muted"
          }`}
          style={{ transform: "translate(-50%, -100%)" }}
        >
          <span className="text-brand-soft">{destination.isoCode}</span>
          <span className="mx-1.5 text-fg-subtle">·</span>
          <span>{destination.country}</span>
          {hover ? (
            <span className="block pt-0.5 text-[0.5625rem] tracking-[0.12em] text-fg-muted">
              {destination.routes > 0 ? `${destination.routes} published route${destination.routes === 1 ? "" : "s"}` : "Routes in confirmation"}
            </span>
          ) : null}
        </div>
      </Html>
    </group>
  );
}

function OriginNode() {
  const pulse = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const group = useRef<THREE.Group>(null);
  const node = useMemo(() => {
    const p = new THREE.Vector3(...latLngToXYZ(ORIGIN.lat, ORIGIN.lng, R + 0.004));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.clone().normalize());
    return { position: p, quaternion: q };
  }, []);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    if (pulse.current) {
      const phase = (t % 2.2) / 2.2;
      const s = 1 + phase * 2.6;
      pulse.current.scale.set(s, s, s);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - phase);
    }
    if (group.current && label.current) {
      group.current.getWorldPosition(_world).normalize();
      _cam.copy(camera.position).normalize();
      const facing = _world.dot(_cam);
      const o = facing > 0.1 ? THREE.MathUtils.smoothstep(facing, 0.1, 0.4) : 0;
      label.current.style.opacity = o.toFixed(3);
      label.current.style.visibility = o < 0.02 ? "hidden" : "visible";
    }
  });

  return (
    <group ref={group} position={node.position}>
      <mesh>
        <sphereGeometry args={[0.02, 20, 20]} />
        <meshBasicMaterial color={PALETTE.brand} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshBasicMaterial color={PALETTE.brand} transparent opacity={0.22} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={pulse} quaternion={node.quaternion}>
        <ringGeometry args={[0.024, 0.028, 48]} />
        <meshBasicMaterial color={PALETTE.brand} transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <Html position={[0, 0, 0]} wrapperClass="pointer-events-none" zIndexRange={[40, 10]} style={{ opacity: 0, visibility: "hidden", pointerEvents: "none" }} ref={label}>
        <div className="whitespace-nowrap font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-fg" style={{ transform: "translate(14px, -50%)" }}>
          <span className="text-brand-soft">Vientiane</span>
          <span className="mx-1.5 text-fg-subtle">·</span>
          <span>Lao PDR</span>
        </div>
      </Html>
    </group>
  );
}

function Scene({
  destinations,
  scroll,
  tier,
  paused,
  onSelect,
  onNodeHover,
}: {
  destinations: GlobeDestination[];
  scroll?: MotionValue<number>;
  tier: GlobeTier;
  /** True while the pointer is down on the globe or hovering a node — auto-rotation waits. */
  paused: boolean;
  onSelect: (slug: string) => void;
  onNodeHover: (hovering: boolean) => void;
}) {
  const spin = useRef<THREE.Group>(null);
  const spinAngle = useRef(0);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const dpr = useThree((s) => s.viewport.dpr);

  const sphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sphereVertex,
        fragmentShader: sphereFragment,
        uniforms: {
          uDeep: { value: new THREE.Color(PALETTE.midnight) },
          uBase: { value: new THREE.Color(PALETTE.navy) },
          uRim: { value: new THREE.Color(PALETTE.platinum) },
        },
      }),
    [],
  );
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(R, 64, 48), []);

  const glowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sphereVertex,
        fragmentShader: glowFragment,
        uniforms: { uColor: { value: new THREE.Color(PALETTE.haze) } },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(R * 1.2, 48, 36), []);

  const graticule = useMemo(() => buildGraticule(R + 0.002), []);
  const graticuleMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: PALETTE.platinum, transparent: true, opacity: 0.045, depthWrite: false }),
    [],
  );

  const landDots = useMemo(() => buildLandDots(tier === "high" ? 1 : 2), [tier]);
  const landMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dotsVertex,
        fragmentShader: dotsFragment,
        uniforms: {
          uColor: { value: new THREE.Color(PALETTE.white) },
          uSize: { value: tier === "high" ? 2.1 : 2.6 },
          uPixelRatio: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [tier],
  );
  useEffect(() => {
    landMaterial.uniforms.uPixelRatio.value = dpr;
  }, [dpr, landMaterial]);

  const stars = useMemo(() => buildStars(tier === "high" ? 260 : 120), [tier]);
  const starMaterial = useMemo(
    () => new THREE.PointsMaterial({ color: PALETTE.white, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.32, depthWrite: false }),
    [],
  );

  const arcs = useMemo(() => buildArcs(destinations), [destinations]);

  useEffect(() => {
    return () => {
      sphereMaterial.dispose();
      sphereGeometry.dispose();
      glowMaterial.dispose();
      glowGeometry.dispose();
      graticule.dispose();
      graticuleMaterial.dispose();
      landDots.dispose();
      landMaterial.dispose();
      stars.dispose();
      starMaterial.dispose();
      for (const a of arcs) {
        a.geometry.dispose();
        a.material.dispose();
      }
    };
  }, [sphereMaterial, sphereGeometry, glowMaterial, glowGeometry, graticule, graticuleMaterial, landDots, landMaterial, stars, starMaterial, arcs]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (!paused) spinAngle.current += AUTO_ROTATE * Math.min(delta, MAX_DELTA);
    if (spin.current) spin.current.rotation.y = spinAngle.current + (scroll?.get() ?? 0) * SCROLL_ROTATE;

    arcs.forEach((a, i) => {
      const p = Math.max(0, Math.min(1, (t - a.delay) / ARC_DRAW_SECONDS));
      a.geometry.setDrawRange(0, Math.round(easeOutCubic(p) * (ARC_POINTS + 1)));
      // gentle pulse once drawn
      a.material.opacity = p >= 1 ? a.baseOpacity * (0.86 + 0.14 * Math.sin(t * 1.6 + i * 0.9)) : a.baseOpacity;
      // travelling packet
      const packet = packets.current[i];
      if (packet) {
        if (p >= 1) {
          const frac = ((t - a.delay - ARC_DRAW_SECONDS) * 0.16 + i * 0.137) % 1;
          a.curve.getPoint(frac, packet.position);
          const glow = Math.sin(frac * Math.PI); // fade at both ends
          packet.scale.setScalar(0.6 + 0.6 * glow);
          packet.visible = true;
        } else {
          packet.visible = false;
        }
      }
    });
  });

  return (
    <>
      <points geometry={stars} material={starMaterial} renderOrder={-2} />
      <group ref={spin}>
        <mesh geometry={glowGeometry} material={glowMaterial} renderOrder={-1} />
        <mesh geometry={sphereGeometry} material={sphereMaterial} />
        <lineSegments geometry={graticule} material={graticuleMaterial} />
        <points geometry={landDots} material={landMaterial} renderOrder={1} />

        <OriginNode />

        {arcs.map((a, i) => (
          <group key={destinations[i]?.slug ?? i}>
            <primitive object={a.line} dispose={null} />
            <mesh
              ref={(el) => {
                packets.current[i] = el;
              }}
              visible={false}
              renderOrder={3}
            >
              <sphereGeometry args={[0.011, 10, 10]} />
              <meshBasicMaterial color={PALETTE.brandSoft} toneMapped={false} />
            </mesh>
            <DestinationNode
              destination={destinations[i]}
              position={a.end}
              appearAt={a.delay + ARC_DRAW_SECONDS}
              onSelect={onSelect}
              onHover={onNodeHover}
            />
          </group>
        ))}
      </group>
    </>
  );
}

/**
 * Drag-to-turn with damping. OrbitControls' own autoRotate is deliberately off:
 * it integrates the raw frame delta, so a throttled background tab would spin
 * the globe by minutes of rotation in a single frame on return. The Scene
 * rotates the globe group instead, with a clamped delta and the same speed.
 */
function Controls({ dragging, onDraggingChange }: { dragging: boolean; onDraggingChange: (d: boolean) => void }) {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    gl.domElement.style.cursor = dragging ? "grabbing" : "grab";
  }, [dragging, gl]);

  return (
    <OrbitControls
      ref={ref}
      enablePan={false}
      enableZoom={false}
      rotateSpeed={0.5}
      enableDamping
      dampingFactor={0.08}
      autoRotate={false}
      minPolarAngle={Math.PI * 0.3}
      maxPolarAngle={Math.PI * 0.7}
      onStart={() => onDraggingChange(true)}
      onEnd={() => onDraggingChange(false)}
    />
  );
}

export function Globe({
  destinations,
  active = true,
  scroll,
  tier = "high",
  onSelect,
}: {
  destinations: GlobeDestination[];
  active?: boolean;
  scroll?: MotionValue<number>;
  tier?: GlobeTier;
  onSelect?: (slug: string) => void;
}) {
  const [hoveringNode, setHoveringNode] = useState(false);
  const [dragging, setDragging] = useState(false);
  return (
    <Canvas
      dpr={tier === "high" ? [1, 1.5] : 1}
      frameloop={active ? "always" : "never"}
      camera={{ position: CAMERA_START, fov: 38, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.style.cursor = "grab";
      }}
      style={{ background: "transparent", width: "100%", height: "100%", touchAction: "pan-y" }}
      aria-hidden
    >
      <Scene
        destinations={destinations}
        scroll={scroll}
        tier={tier}
        paused={hoveringNode || dragging}
        onSelect={onSelect ?? (() => undefined)}
        onNodeHover={setHoveringNode}
      />
      <Controls dragging={dragging} onDraggingChange={setDragging} />
    </Canvas>
  );
}
