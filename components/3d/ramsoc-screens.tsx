"use client"

import { Suspense, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { RoundedBox, useTexture } from "@react-three/drei"
import * as THREE from "three"
import { useOnScreenActive } from "@/components/space/on-screen"
import { useIsMobile } from "@/components/space/use-mobile"
import { Prewarm } from "./prewarm"

/**
 * RAMSOC: the society's web platforms as floating browser windows on a
 * curved arc, the way a VR workspace lays screens around you, plus the
 * mobile app on a phone floating in front.
 *
 * Screens are self-lit (basic material, no tone mapping) so the sites keep
 * their real colours; everything only bobs gently — no pointer parallax.
 */

const SITES = [
  { src: "/ramsoc/site-home.jpg", url: "ramsocunsw.org" },
  { src: "/ramsoc/site-buildathon.jpg", url: "buildathon.ramsocunsw.org" },
  { src: "/ramsoc/site-sumobots.jpg", url: "sumobots.ramsocunsw.org" },
  { src: "/ramsoc/site-pickabots.jpg", url: "pickabots.ramsocunsw.org" },
]
const APP = "/ramsoc/app-home.jpg"
const ACCENT = "#3fb6e8"

// screen size in world units (16:10 sites)
const SW = 1.6
const SH = 1.0
const BAR = 0.07

/** Browser title bar: traffic lights and the page URL, drawn once to a canvas. */
function useBarTexture(url: string) {
  return useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024
    c.height = Math.round((1024 * BAR) / SW)
    const g = c.getContext("2d")!
    g.fillStyle = "#16191f"
    g.fillRect(0, 0, c.width, c.height)
    const r = c.height * 0.16
    ;["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => {
      g.fillStyle = col
      g.beginPath(); g.arc(c.height * 0.5 + i * r * 3, c.height / 2, r, 0, Math.PI * 2); g.fill()
    })
    g.fillStyle = "#232730"
    const w = c.width * 0.42
    const x = (c.width - w) / 2
    g.beginPath(); g.roundRect(x, c.height * 0.2, w, c.height * 0.6, c.height * 0.3); g.fill()
    g.fillStyle = "#aab3c0"
    g.font = `500 ${Math.round(c.height * 0.36)}px ui-sans-serif, system-ui`
    g.textAlign = "center"
    g.textBaseline = "middle"
    g.fillText(url, c.width / 2, c.height / 2 + 1)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [url])
}

/** Soft accent halo behind each window. */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas")
    c.width = c.height = 128
    const g = c.getContext("2d")!
    const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64)
    grad.addColorStop(0, "rgba(255,255,255,0.55)")
    grad.addColorStop(1, "rgba(255,255,255,0)")
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
}

function BrowserWindow({
  src,
  url,
  phase,
  ...props
}: { src: string; url: string; phase: number } & React.ComponentProps<"group">) {
  const tex = useTexture(src)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const bar = useBarTexture(url)
  const glow = useGlowTexture()
  useEffect(() => () => { bar.dispose(); glow.dispose() }, [bar, glow])
  const float = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!float.current) return
    const t = state.clock.getElapsedTime()
    float.current.position.y = Math.sin(t * 0.6 + phase) * 0.035
    float.current.rotation.z = Math.sin(t * 0.4 + phase * 1.3) * 0.006
  })

  return (
    <group {...(props as object)}>
      <group ref={float}>
        <mesh position={[0, 0.02, -0.06]} scale={[SW * 1.5, (SH + BAR) * 1.7, 1]}>
          <planeGeometry />
          <meshBasicMaterial map={glow} color={ACCENT} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <RoundedBox args={[SW + 0.04, SH + BAR + 0.04, 0.03]} radius={0.02} smoothness={3} position={[0, BAR / 2, -0.02]}>
          <meshStandardMaterial color="#0c0e12" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, SH / 2 + BAR / 2, 0.001]}>
          <planeGeometry args={[SW, BAR]} />
          <meshBasicMaterial map={bar} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[SW, SH]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/** Rounded-rect alpha mask so the screen has the phone's corner radius. */
function useRoundedMask(w: number, h: number, r: number) {
  return useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 256
    c.height = Math.round((256 * h) / w)
    const g = c.getContext("2d")!
    g.fillStyle = "#000"
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = "#fff"
    g.beginPath(); g.roundRect(0, 0, c.width, c.height, (r / w) * c.width); g.fill()
    return new THREE.CanvasTexture(c)
  }, [w, h, r])
}

/** Diagonal sheen across the cover glass. */
function useGlassTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas")
    c.width = c.height = 256
    const g = c.getContext("2d")!
    const grad = g.createLinearGradient(0, 0, 256, 256)
    grad.addColorStop(0, "rgba(255,255,255,0.0)")
    grad.addColorStop(0.42, "rgba(255,255,255,0.0)")
    grad.addColorStop(0.5, "rgba(255,255,255,0.10)")
    grad.addColorStop(0.62, "rgba(255,255,255,0.0)")
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])
}

/**
 * A modern phone: brushed-metal frame with a bright chamfer, black glass
 * front, rounded display, dynamic island, side buttons, and a faint sheen on
 * the cover glass. The app screenshot is self-lit like a real display.
 */
function Phone(props: React.ComponentProps<"group">) {
  const tex = useTexture(APP)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const spin = useRef<THREE.Group>(null)
  const W = 0.42
  const H = W * (1688 / 780)
  const bezel = 0.018
  const mask = useRoundedMask(W, H, 0.055)
  const glass = useGlassTexture()
  useEffect(() => () => { mask.dispose(); glass.dispose() }, [mask, glass])

  useFrame((state) => {
    if (!spin.current) return
    const t = state.clock.getElapsedTime()
    spin.current.rotation.y = -0.32 + Math.sin(t * 0.45) * 0.12
    spin.current.rotation.x = Math.sin(t * 0.35 + 1) * 0.05
    spin.current.position.y = Math.sin(t * 0.7 + 2) * 0.05
  })

  const FW = W + bezel * 2
  const FH = H + bezel * 2
  return (
    <group {...(props as object)}>
      <group ref={spin}>
        {/* metal frame, then a slightly smaller black glass slab on its face */}
        <RoundedBox args={[FW + 0.012, FH + 0.012, 0.05]} radius={0.068} smoothness={6} position={[0, 0, -0.026]}>
          <meshStandardMaterial color="#b9bec7" metalness={1} roughness={0.28} />
        </RoundedBox>
        <RoundedBox args={[FW, FH, 0.052]} radius={0.062} smoothness={6} position={[0, 0, -0.025]}>
          <meshStandardMaterial color="#050608" metalness={0.2} roughness={0.15} />
        </RoundedBox>
        {/* side buttons: action + volume on the left, power on the right */}
        {[
          [-FW / 2 - 0.009, H * 0.3, 0.05],
          [-FW / 2 - 0.009, H * 0.18, 0.085],
          [-FW / 2 - 0.009, H * 0.05, 0.085],
          [FW / 2 + 0.009, H * 0.16, 0.12],
        ].map(([x, y, len], i) => (
          <RoundedBox key={i} args={[0.012, len, 0.022]} radius={0.005} smoothness={2} position={[x, y, -0.026]}>
            <meshStandardMaterial color="#9da3ad" metalness={1} roughness={0.3} />
          </RoundedBox>
        ))}
        {/* display */}
        <mesh position={[0, 0, 0.0015]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={tex} alphaMap={mask} transparent toneMapped={false} />
        </mesh>
        {/* dynamic island */}
        <RoundedBox args={[0.11, 0.032, 0.002]} radius={0.016} smoothness={3} position={[0, H / 2 - 0.035, 0.003]}>
          <meshBasicMaterial color="#000" />
        </RoundedBox>
        {/* cover-glass sheen */}
        <mesh position={[0, 0, 0.004]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={glass} alphaMap={mask} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * The arc: windows on a circle around a point near the camera, each turned to
 * face it, the outer two dropped a little so the row curves like a visor.
 */
function Workspace({ phoneOnly }: { phoneOnly: boolean }) {
  // phones: just the app, floating centred above the copy
  if (phoneOnly) return <Phone position={[0, 0, 0]} scale={1.6} />
  const R = 3.9
  const centre = new THREE.Vector3(1.15, 0.8, 3.0)
  const angles = [-0.6, -0.2, 0.2, 0.6]
  return (
    <>
      {SITES.map((site, i) => {
        const a = angles[i]
        const pos: [number, number, number] = [
          centre.x + Math.sin(a) * R,
          centre.y - a * a * 0.9,
          centre.z - Math.cos(a) * R,
        ]
        return <BrowserWindow key={site.src} {...site} phase={i * 1.7} position={pos} rotation={[0.04, -a * 1.15, 0]} scale={0.86} />
      })}
      <Phone position={[1.75, -0.42, 1.6]} scale={0.95} />
    </>
  )
}

const TARGET = new THREE.Vector3(0.75, 0.15, 0)
const OFFSET = new THREE.Vector3(0, 0.15, 5.4)

/** Wide panels keep the left column clear; portrait pulls back and centres. */
function Framing({ phoneOnly }: { phoneOnly: boolean }) {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    let back = aspect < 1 ? Math.min(2.2, 1.1 / aspect) : 1
    const target = TARGET.clone()
    if (phoneOnly) {
      // aim below the phone so it floats in the upper half, clear of the copy
      target.set(0, -0.62, 0)
      back = 1
    } else if (aspect < 1) target.set(1.0, -0.9, 0)
    camera.position.copy(target).addScaledVector(OFFSET, back)
    camera.lookAt(target)
    camera.updateProjectionMatrix()
  }, [camera, size, phoneOnly])
  return null
}

export function RamsocScreens() {
  const active = useOnScreenActive()
  const mobile = useIsMobile()
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={active ? "always" : "demand"}
        dpr={[1, 1.5]}
        camera={{ fov: 35, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.AgXToneMapping
          gl.toneMappingExposure = 1.2
        }}
      >
        <Framing phoneOnly={mobile} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <pointLight position={[1.2, 0.6, 1.5]} color={ACCENT} intensity={3} distance={6} />
        <Suspense fallback={null}>
          <Workspace phoneOnly={mobile} />
          <Prewarm />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default RamsocScreens
