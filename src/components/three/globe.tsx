"use client";

import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
import { ORIGIN, angularDistance, latLngToXYZ, type GlobeDestination } from "./geo";

/**
 * The hero globe — the site's WOW moment.
 *
 * A photographic Earth (NASA Blue Marble day surface, terrain relief, ocean
 * reflectivity, a drifting cloud layer and city lights), a soft atmosphere,
 * Vientiane as the red pulsing origin, red great-circle routes with travelling
 * packets, and labelled, clickable destination nodes. Drag to turn; it turns
 * itself when left alone.
 *
 * Textures total ~1.6 MB and load inside Suspense (the SVG map shows until
 * then). Pixel ratio is capped (1.5 high tier / 1 low tier), the frame loop is
 * paused when the hero is off-screen, and every hand-built resource is
 * disposed on unmount.
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

export type GlobeTone = "dark" | "light";

/**
 * Two renderings of the same globe. `dark`: the original deep-blue sphere with white land for a
 * midnight ground. `light`: a white sphere with brand-blue land, graticule and rim, a soft blue
 * halo (normal blending — additive glow vanishes on white) and no star field, for the white hero.
 */
const TONES = {
  dark: {
    glow: PALETTE.haze, glowAdditive: true, node: PALETTE.brandSoft, nodeMuted: PALETTE.platinum, packet: PALETTE.brandSoft, ambient: 0.6, sun: 3.2,
    chip: "border-white/25 bg-[#0B1350]/70 text-white/85", chipHover: "border-[#FF8A85] bg-[#0B1350]/90 text-white", code: "text-[#FF8A85]", origin: "text-white", originAccent: "text-[#FF8A85]",
  },
  light: {
    glow: "#6E8FFF", glowAdditive: false, node: PALETTE.brand, nodeMuted: "#7D8AAE", packet: PALETTE.brand, ambient: 1.0, sun: 3.4,
    chip: "border-[#103090]/20 bg-white/90 text-[#0B1350] shadow-sm", chipHover: "border-[#103090] bg-[#103090] text-white shadow-md", code: "text-[#A3120F]", origin: "text-[#0B1350]", originAccent: "text-[#A3120F]",
  },
} as const;
type Tone = (typeof TONES)[GlobeTone];

const TEXTURES = {
  day: "/textures/earth/earth_atmos_2048.jpg",
  normal: "/textures/earth/earth_normal_2048.jpg",
  specular: "/textures/earth/earth_specular_2048.jpg",
  clouds: "/textures/earth/earth_clouds_1024.png",
  lights: "/textures/earth/earth_lights_2048.png",
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

// ── Geometry builders ────────────────────────────────────────────────────────

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
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
  const start = new THREE.Vector3(...latLngToXYZ(ORIGIN.lat, ORIGIN.lng, R + 0.016));
  return destinations.map((d, i) => {
    const end = new THREE.Vector3(...latLngToXYZ(d.lat, d.lng, R + 0.016));
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
  pal,
}: {
  destination: GlobeDestination;
  position: THREE.Vector3;
  appearAt: number;
  onSelect: (slug: string) => void;
  onHover: (hovering: boolean) => void;
  pal: Tone;
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
          <meshBasicMaterial color={destination.verified ? pal.node : pal.nodeMuted} toneMapped={false} />
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
          className={`whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] backdrop-blur-sm transition-colors duration-[var(--dur-fast)] ${hover ? pal.chipHover : pal.chip}`}
          style={{ transform: "translate(-50%, -100%)" }}
        >
          <span className={hover ? "text-white/80" : pal.code}>{destination.isoCode}</span>
          <span className="mx-1.5 opacity-50">·</span>
          <span>{destination.country}</span>
          {hover ? (
            <span className="block pt-1 text-[0.5625rem] normal-case tracking-[0.06em] opacity-90">
              {destination.universities && destination.universities.length > 0 ? destination.universities.join(" · ") : null}
              <span className="block pt-0.5 uppercase tracking-[0.12em] opacity-80">
                {destination.routes > 0 ? `${destination.routes} published route${destination.routes === 1 ? "" : "s"} · click to fly` : "Routes in confirmation"}
              </span>
            </span>
          ) : null}
        </div>
      </Html>
    </group>
  );
}

function OriginNode({ pal }: { pal: Tone }) {
  const pulse = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const group = useRef<THREE.Group>(null);
  const node = useMemo(() => {
    const p = new THREE.Vector3(...latLngToXYZ(ORIGIN.lat, ORIGIN.lng, R + 0.016));
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
        <div className={`whitespace-nowrap font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] ${pal.origin}`} style={{ transform: "translate(16px, 10px)" }}>
          <span className={pal.originAccent}>Vientiane</span>
          <span className="mx-1.5 opacity-50">·</span>
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
  pal,
  flyTo,
}: {
  destinations: GlobeDestination[];
  scroll?: MotionValue<number>;
  tier: GlobeTier;
  /** True while the pointer is down on the globe or hovering a node — auto-rotation waits. */
  paused: boolean;
  onSelect: (slug: string) => void;
  onNodeHover: (hovering: boolean) => void;
  pal: Tone;
  /** Slug of a destination the globe should turn toward (set on click, before navigating). */
  flyTo: string | null;
}) {
  const spin = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const spinAngle = useRef(0);
  const flyPos = useRef(new THREE.Vector3());
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const gl = useThree((s) => s.gl);

  // Textures suspend until loaded; the SVG map is shown meanwhile.
  const [day, normal, specular, cloudMap, lights] = useLoader(THREE.TextureLoader, [TEXTURES.day, TEXTURES.normal, TEXTURES.specular, TEXTURES.clouds, TEXTURES.lights]);
  useEffect(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    for (const t of [day, cloudMap, lights]) t.colorSpace = THREE.SRGBColorSpace;
    for (const t of [day, normal, specular, cloudMap, lights]) {
      t.anisotropy = aniso;
      t.needsUpdate = true;
    }
  }, [day, normal, specular, cloudMap, lights, gl]);

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(R, tier === "high" ? 96 : 64, tier === "high" ? 64 : 48), [tier]);
  const cloudGeometry = useMemo(() => new THREE.SphereGeometry(R * 1.012, 64, 48), []);
  const glowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sphereVertex,
        fragmentShader: glowFragment,
        uniforms: { uColor: { value: new THREE.Color(pal.glow) } },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: pal.glowAdditive ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    [pal],
  );
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(R * 1.18, 48, 36), []);
  const arcs = useMemo(() => buildArcs(destinations), [destinations]);

  useEffect(() => {
    return () => {
      sphereGeometry.dispose();
      cloudGeometry.dispose();
      glowMaterial.dispose();
      glowGeometry.dispose();
      for (const a of arcs) {
        a.geometry.dispose();
        a.material.dispose();
      }
    };
  }, [sphereGeometry, cloudGeometry, glowMaterial, glowGeometry, arcs]);

  useFrame(({ clock, camera }, delta) => {
    const t = clock.getElapsedTime();
    const d = Math.min(delta, MAX_DELTA);
    const flying = flyTo ? arcs[destinations.findIndex((x) => x.slug === flyTo)] : undefined;
    if (flying && spin.current) {
      // Turn the globe so the chosen destination faces the camera, and ease the camera in a little.
      spin.current.updateMatrixWorld();
      flyPos.current.copy(flying.end).applyMatrix4(spin.current.matrixWorld);
      const want = Math.atan2(camera.position.x, camera.position.z);
      const have = Math.atan2(flyPos.current.x, flyPos.current.z);
      let err = want - have;
      while (err > Math.PI) err -= Math.PI * 2;
      while (err < -Math.PI) err += Math.PI * 2;
      spinAngle.current += err * Math.min(1, d * 7);
      const len = camera.position.length();
      camera.position.multiplyScalar(THREE.MathUtils.lerp(len, CAMERA_DISTANCE * 0.84, Math.min(1, d * 3)) / len);
    } else if (!paused) spinAngle.current += AUTO_ROTATE * d;
    if (spin.current) spin.current.rotation.y = spinAngle.current + (scroll?.get() ?? 0) * SCROLL_ROTATE;
    // Clouds drift a little faster than the ground beneath them.
    if (clouds.current) clouds.current.rotation.y += d * 0.018;

    arcs.forEach((a, i) => {
      const p = Math.max(0, Math.min(1, (t - a.delay) / ARC_DRAW_SECONDS));
      a.geometry.setDrawRange(0, Math.round(easeOutCubic(p) * (ARC_POINTS + 1)));
      a.material.opacity = p >= 1 ? a.baseOpacity * (0.86 + 0.14 * Math.sin(t * 1.6 + i * 0.9)) : a.baseOpacity;
      const packet = packets.current[i];
      if (packet) {
        if (p >= 1) {
          const frac = ((t - a.delay - ARC_DRAW_SECONDS) * 0.16 + i * 0.137) % 1;
          a.curve.getPoint(frac, packet.position);
          const glow = Math.sin(frac * Math.PI);
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
      {/* Sun from the viewer's upper right so the hemisphere facing the page is in daylight; fill keeps the limb readable */}
      <ambientLight intensity={pal.ambient} />
      <directionalLight position={[3.5, 2.5, 6]} intensity={pal.sun} />
      <hemisphereLight args={["#ffffff", "#6E8FFF", 0.35]} />
      <group ref={spin}>
        <mesh geometry={glowGeometry} material={glowMaterial} renderOrder={-1} />
        <mesh geometry={sphereGeometry}>
          <meshPhongMaterial
            map={day}
            normalMap={normal}
            normalScale={new THREE.Vector2(0.55, 0.55)}
            specularMap={specular}
            specular={new THREE.Color("#5f7fd0")}
            shininess={16}
            emissiveMap={lights}
            emissive={new THREE.Color("#ffd9a3")}
            emissiveIntensity={0.12}
          />
        </mesh>
        <mesh ref={clouds} geometry={cloudGeometry} renderOrder={0}>
          <meshPhongMaterial map={cloudMap} transparent opacity={0.55} depthWrite={false} />
        </mesh>

        <OriginNode pal={pal} />

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
              <meshBasicMaterial color={pal.packet} toneMapped={false} />
            </mesh>
            <DestinationNode
              destination={destinations[i]}
              position={a.end}
              appearAt={a.delay + ARC_DRAW_SECONDS}
              onSelect={onSelect}
              onHover={onNodeHover}
              pal={pal}
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
  tone = "dark",
  onSelect,
  flyTo = null,
}: {
  destinations: GlobeDestination[];
  active?: boolean;
  scroll?: MotionValue<number>;
  tier?: GlobeTier;
  tone?: GlobeTone;
  onSelect?: (slug: string) => void;
  flyTo?: string | null;
}) {
  const pal = TONES[tone];
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
        pal={pal}
        flyTo={flyTo}
      />
      <Controls dragging={dragging} onDraggingChange={setDragging} />
    </Canvas>
  );
}
