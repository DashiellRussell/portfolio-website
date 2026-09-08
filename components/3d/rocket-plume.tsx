"use client"

import { useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

/**
 * Raymarched rocket exhaust plume.
 *
 * The plume is a volume, not a particle system: shock diamonds are *standing*
 * waves that stay fixed relative to the nozzle while the gas flows through
 * them, so they have to live in nozzle-space. Particles advect and would drag
 * the diamonds downstream with them.
 *
 * Three signals stack inside the density function:
 *   1. barrel shock   - radius modulated by cos(z * TAU / L), L from Prandtl's
 *                       shock spacing, amplitude decaying downstream
 *   2. shear layer    - domain-warped fbm scrolling in +z at exhaust speed,
 *                       amplitude ramping with radius so the core stays clean
 *   3. emission       - blackbody-ish ramp driven by local temperature, with
 *                       the diamonds spiking hottest
 */

const BOX_MIN = new THREE.Vector3(-1.7, -9.5, -1.7)
const BOX_MAX = new THREE.Vector3(1.7, 0.3, 1.7)

const vertexShader = /* glsl */ `
  varying vec3 vObjPos;

  void main() {
    vObjPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vObjPos;

  uniform vec3  uCamObj;
  uniform vec3  uBoxMin;
  uniform vec3  uBoxMax;
  uniform float uTime;
  uniform float uFrame;
  uniform float uThrottle;
  uniform float uShockSpacing;
  uniform float uShockDecay;
  uniform float uSoot;
  uniform float uTurbulence;
  uniform float uFlowSpeed;
  uniform float uExposure;

  #define TAU 6.28318530718
  #define STEPS 56

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i + vec3(0.0, 0.0, 0.0)), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }

  // 3 octaves is the budget - the radial reject below skips most samples anyway
  float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      f += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return f;
  }

  // barrel shock radius at axial distance z, plus the shock phase/envelope
  float plumeRadius(float z, out float shockEnv, out float phase) {
    float R0 = 0.30 + 0.07 * uThrottle;
    shockEnv = exp(-z * uShockDecay);
    phase = z * TAU / max(uShockSpacing, 0.05);
    // tight near the throat, billowing once the shock train has died
    float spread = 1.0 + 0.10 * z + 0.022 * z * z;
    return R0 * spread * (1.0 + 0.30 * shockEnv * cos(phase));
  }

  void sampleMedium(vec3 p, out float density, out float temp) {
    density = 0.0;
    temp = 0.0;

    // nozzle exit sits at y = 0, plume flows down -y
    float z = -p.y;
    if (z < -0.02) return;
    z = max(z, 0.0);

    float r = length(p.xz);

    float shockEnv, phase;
    float R = plumeRadius(z, shockEnv, phase);

    // cheap radial reject before touching the noise - this is the whole perf story
    if (r > R * 2.4) return;

    // turbulent shear layer: quiet in the core, torn at the edges, worse downstream.
    // eddy size scales with R so the plume coarsens as it expands.
    float edge = smoothstep(R * 0.25, R * 1.05, r);
    float grow = smoothstep(0.0, 1.4, z);
    vec3 np = vec3(p.x, p.y + uTime * uFlowSpeed, p.z);
    vec3 warp = vec3(
      fbm(np * 1.7 + 11.3),
      fbm(np * 1.7 + 27.7),
      fbm(np * 1.7 + 43.1)
    ) - 0.44;
    float turb = (fbm(np * 2.6 + warp * 2.2) - 0.44) + 0.5 * (fbm(np * 6.5) - 0.44);
    float rEff = r + turb * uTurbulence * edge * grow * R * 1.6;

    // dissipate before the volume bound so the tail never shows a hard cut
    float tail = smoothstep(8.2, 3.2, z);

    // sharp-ish boundary, otherwise the eddies smear into mush
    float core = smoothstep(R, R * 0.78, rEff);
    if (core <= 0.0) return;

    float axial = exp(-z * 0.34) * tail;

    // mach discs. A disc is lens-shaped, not a flat band: it swells from nothing
    // at the cell boundary to its widest on the axis at the pinch, so the radial
    // extent has to shrink with the cell coordinate or it reads as a stripe.
    float u = fract(z / max(uShockSpacing, 0.05) + 0.5);
    float lens = max(0.0, 1.0 - abs(2.0 * u - 1.0) * 1.40);
    float discR = R * 0.62 * lens;
    float diamond = shockEnv * lens * smoothstep(discR, 0.0, r) * tail;

    // thin shell on the barrel shock itself - reads as the crossing X pattern
    float shell = exp(-pow((r - R) / (0.09 * R + 0.010), 2.0)) * shockEnv;

    density = (core * (1.0 + 2.6 * diamond) + shell * 0.5) * tail;
    density *= mix(0.6, 1.0, uThrottle);

    temp = (axial * (0.5 + 0.5 * core) + 2.0 * diamond * exp(-z * 0.08) + 0.45 * shell) * tail;
    temp = clamp(temp, 0.0, 2.4);
  }

  vec3 emissionColor(float t) {
    float x = clamp(t / 1.6, 0.0, 1.0);
    vec3 cool = vec3(0.55, 0.07, 0.01);
    vec3 warm = vec3(1.00, 0.30, 0.04);
    vec3 mid  = vec3(1.00, 0.64, 0.18);
    vec3 hot  = vec3(1.00, 0.94, 0.82);
    vec3 c = mix(cool, warm, smoothstep(0.00, 0.35, x));
    c = mix(c, mid, smoothstep(0.30, 0.68, x));
    c = mix(c, hot, smoothstep(0.66, 1.00, x));
    // low soot = hydrolox, nearly colourless with a blue lean
    vec3 lean = mix(vec3(0.45, 0.62, 1.00), vec3(1.0), smoothstep(0.5, 1.0, x));
    c = mix(lean, c, uSoot);
    // the ramp above is authored in sRGB, but we shade in linear and
    // colorspace_fragment re-encodes on output - skip this and orange reads beige
    return pow(c, vec3(2.2));
  }

  vec2 intersectBox(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax) {
    vec3 inv = 1.0 / rd;
    vec3 t0 = (bmin - ro) * inv;
    vec3 t1 = (bmax - ro) * inv;
    vec3 tn = min(t0, t1);
    vec3 tf = max(t0, t1);
    return vec2(max(max(tn.x, tn.y), tn.z), min(min(tf.x, tf.y), tf.z));
  }

  void main() {
    vec3 ro = uCamObj;
    vec3 rd = normalize(vObjPos - uCamObj);

    vec2 t = intersectBox(ro, rd, uBoxMin, uBoxMax);
    t.x = max(t.x, 0.0);
    if (t.y <= t.x) discard;

    float dt = (t.y - t.x) / float(STEPS);

    // per-pixel jitter trades banding for a little noise
    float jitter = hash13(vec3(gl_FragCoord.xy, uFrame));
    float depth = t.x + dt * jitter;

    vec3 acc = vec3(0.0);
    float trans = 1.0;

    for (int i = 0; i < STEPS; i++) {
      vec3 p = ro + rd * depth;

      float d, temp;
      sampleMedium(p, d, temp);

      if (d > 0.001) {
        vec3 em = emissionColor(temp) * pow(temp, 3.0) * 3.0;
        acc += em * d * trans * dt;
        // cool gas is sooty and absorbs hard - that is what gives the dark edges
        float absorb = mix(2.0, 6.0, uSoot) * (0.4 + 0.8 * (1.0 - clamp(temp, 0.0, 1.0)));
        trans *= exp(-d * dt * absorb);   // Beer-Lambert, so the plume self-occludes
        if (trans < 0.01) break;
      }

      depth += dt;
      if (depth > t.y) break;
    }

    // Hue-preserving tonemap. Mapping each channel independently saturates red
    // first and washes the whole plume to beige, so map brightness only and let
    // just the hottest cores bleach toward white.
    float peak = max(max(acc.r, acc.g), acc.b);
    if (peak < 0.0015) discard;
    vec3 hue = acc / peak;
    float e = 1.0 - exp(-peak * uExposure);
    vec3 col = mix(hue, vec3(1.0), smoothstep(0.72, 1.0, e)) * e;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

type PlumeTuning = {
  /** 0..1 chamber throttle - drives width, density and flicker depth */
  throttle?: number
  /** 0 = hydrolox (near invisible blue), 1 = kerolox (orange, sooty) */
  soot?: number
  /** mach disc spacing; physically ~1.3 * D * sqrt(M^2 - 1) */
  shockSpacing?: number
  /** how fast the diamonds fade downstream */
  shockDecay?: number
  turbulence?: number
  flowSpeed?: number
  exposure?: number
  /** disables flicker and freezes the flow for prefers-reduced-motion */
  still?: boolean
}

export function PlumeVolume({
  throttle = 0.85,
  soot = 0.9,
  shockSpacing = 0.85,
  shockDecay = 0.40,
  turbulence = 1.15,
  flowSpeed = 2.6,
  exposure = 0.55,
  still = false,
}: PlumeTuning) {
  const mesh = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const geometry = useMemo(() => {
    const size = new THREE.Vector3().subVectors(BOX_MAX, BOX_MIN)
    const center = new THREE.Vector3().addVectors(BOX_MIN, BOX_MAX).multiplyScalar(0.5)
    const g = new THREE.BoxGeometry(size.x, size.y, size.z)
    g.translate(center.x, center.y, center.z)
    return g
  }, [])

  const uniforms = useMemo(
    () => ({
      uCamObj: { value: new THREE.Vector3() },
      uBoxMin: { value: BOX_MIN.clone() },
      uBoxMax: { value: BOX_MAX.clone() },
      uTime: { value: 0 },
      uFrame: { value: 0 },
      uThrottle: { value: throttle },
      uShockSpacing: { value: shockSpacing },
      uShockDecay: { value: shockDecay },
      uSoot: { value: soot },
      uTurbulence: { value: turbulence },
      uFlowSpeed: { value: flowSpeed },
      uExposure: { value: exposure },
    }),
    // built once; live edits go through useFrame below
    [],
  )

  const camObj = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    if (!mesh.current) return
    const u = uniforms

    const t = still ? 0 : state.clock.getElapsedTime()
    u.uTime.value = t
    u.uFrame.value = (u.uFrame.value + 1) % 64

    // combustion roughness - two detuned sines read as unsteady, not periodic
    const flicker = still ? 0 : Math.sin(t * 37.0) * 0.02 + Math.sin(t * 11.3) * 0.03
    u.uThrottle.value = THREE.MathUtils.clamp(throttle + flicker, 0, 1)
    u.uShockSpacing.value = shockSpacing
    u.uShockDecay.value = shockDecay
    u.uSoot.value = soot
    u.uTurbulence.value = turbulence
    u.uFlowSpeed.value = flowSpeed
    u.uExposure.value = exposure

    // the raymarch runs in object space, so the camera has to come with it
    camObj.copy(camera.position)
    mesh.current.worldToLocal(camObj)
    u.uCamObj.value.copy(camObj)
  })

  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/** Bell nozzle so the plume has something to come out of. */
function Nozzle() {
  const geometry = useMemo(() => {
    // (radius, y) contour: chamber -> throat -> expansion bell -> exit plane
    const profile = [
      [0.30, 1.35],
      [0.30, 1.02],
      [0.17, 0.84],
      [0.12, 0.71],
      [0.15, 0.61],
      [0.22, 0.44],
      [0.29, 0.26],
      [0.34, 0.09],
      [0.37, 0.0],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(profile, 64)
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#9ca3af" metalness={0.95} roughness={0.32} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Throw-away light so the nozzle lip catches the plume's glow. */
function PlumeGlow({ still }: { still: boolean }) {
  const light = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (!light.current) return
    const t = still ? 0 : state.clock.getElapsedTime()
    light.current.intensity = 14 + (still ? 0 : Math.sin(t * 29.0) * 1.6 + Math.sin(t * 8.7) * 2.2)
  })

  return <pointLight ref={light} position={[0, -0.5, 0]} color="#ff7a2a" intensity={14} distance={6} decay={2} />
}

export function RocketPlume({
  className,
  ...tuning
}: PlumeTuning & { className?: string }) {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const still = tuning.still ?? prefersReducedMotion

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [4.2, -2.2, 6.4], fov: 34 }}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
      >
        <color attach="background" args={["#05060a"]} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 4, 5]} intensity={1.2} />
        <PlumeGlow still={still} />
        <Nozzle />
        <PlumeVolume {...tuning} still={still} />
      </Canvas>
    </div>
  )
}

export default RocketPlume
