import * as THREE from "three"
import type { PanelVariant, LightingVariant } from "./panel-variants"

/**
 * Shared spacecraft construction, so the hero render and the comparison lab
 * cannot drift apart. Everything that varies between looks is a parameter;
 * the geometry is identical in both places.
 */

/** Solar-cell texture built from a variant's palette. */
export function makeCellTexture(v: PanelVariant): THREE.Texture {
  const c = document.createElement("canvas")
  c.width = 512
  c.height = 512
  const g = c.getContext("2d")!

  const grad = g.createLinearGradient(0, 0, c.width, c.height)
  grad.addColorStop(0, v.stops[0])
  grad.addColorStop(0.45, v.stops[1])
  grad.addColorStop(1, v.stops[2])
  g.fillStyle = grad
  g.fillRect(0, 0, c.width, c.height)

  // Fine cell seams — thin and low contrast. Heavy gridlines read as a cartoon
  // panel rather than a finished surface.
  g.strokeStyle = v.seam
  g.lineWidth = 1.25
  for (let i = 1; i < v.cells; i++) {
    const p = (i * c.width) / v.cells
    g.beginPath()
    g.moveTo(p, 0)
    g.lineTo(p, c.height)
    g.stroke()
    g.beginPath()
    g.moveTo(0, p)
    g.lineTo(c.width, p)
    g.stroke()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 1)
  return tex
}

/**
 * Orbital environment for PMREM: dark sky, a small very bright sun, and a
 * large dim planet. Deliberately brighter than a literal vacuum — a physically
 * honest black sky leaves the hull almost unlit, and metal with nothing to
 * reflect reads as flat grey.
 */
export function makeSpaceEnvironment(l: LightingVariant): THREE.Scene {
  const env = new THREE.Scene()

  env.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(60, 24, 16),
      new THREE.MeshBasicMaterial({ color: l.sky, side: THREE.BackSide })
    )
  )

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(36, 24, 16),
    new THREE.MeshBasicMaterial({ color: l.planet })
  )
  planet.position.set(-8, -44, -8)
  env.add(planet)

  const bounce = new THREE.Mesh(
    new THREE.SphereGeometry(22, 16, 12),
    new THREE.MeshBasicMaterial({ color: l.bounce })
  )
  bounce.position.set(-34, 12, -26)
  env.add(bounce)

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  )
  sun.position.set(26, 20, 22)
  env.add(sun)

  return env
}

export function addLights(scene: THREE.Scene, l: LightingVariant) {
  const sun = new THREE.DirectionalLight(l.sun.color, l.sun.intensity)
  sun.position.set(...l.sun.pos)
  scene.add(sun)

  const fill = new THREE.DirectionalLight(l.fill.color, l.fill.intensity)
  fill.position.set(...l.fill.pos)
  scene.add(fill)

  const rim = new THREE.DirectionalLight(l.rim.color, l.rim.intensity)
  rim.position.set(...l.rim.pos)
  scene.add(rim)

  scene.add(new THREE.AmbientLight(l.ambient.color, l.ambient.intensity))
}

/** Chassis dimensions, shared so callers can position things against them. */
export const BUS = { W: 1.3, T: 0.26, D: 2.9 }

export interface BuildOptions {
  panel: PanelVariant
  /** Omit the beams for close-up material studies. */
  lasers?: boolean
}

export interface BuiltSatellite {
  group: THREE.Group
  /** Beam groups, for gating and pulsing. Empty when `lasers` is false. */
  beams: THREE.Group[]
}

export function buildSatellite({ panel, lasers = true }: BuildOptions): BuiltSatellite {
  const group = new THREE.Group()

  // Near-mirror anodised aluminium for the structure.
  const alu = new THREE.MeshStandardMaterial({
    color: 0xccd6e2,
    metalness: 0.96,
    roughness: 0.13,
    envMapIntensity: 2.0,
  })
  const aluDark = new THREE.MeshStandardMaterial({
    color: 0x7e8a99,
    metalness: 0.94,
    roughness: 0.24,
    envMapIntensity: 1.5,
  })
  // Gold MLI — the one warm note, and instantly reads as spacecraft.
  const mli = new THREE.MeshStandardMaterial({
    color: 0xd6a03a,
    metalness: 0.95,
    roughness: 0.28,
    envMapIntensity: 1.8,
  })

  // ---- Flat chassis ----
  group.add(new THREE.Mesh(new THREE.BoxGeometry(BUS.W, BUS.T, BUS.D), alu))

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(BUS.W * 0.46, 0.1, BUS.D * 0.72),
    aluDark
  )
  spine.position.y = BUS.T / 2 + 0.05
  group.add(spine)

  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(BUS.W * 0.66, 0.035, BUS.D * 0.4),
    mli
  )
  blanket.position.set(0, -BUS.T / 2 - 0.018, -BUS.D * 0.22)
  group.add(blanket)

  for (const sz of [1, -1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(BUS.W + 0.05, BUS.T + 0.05, 0.07),
      aluDark
    )
    rail.position.z = (sz * BUS.D) / 2
    group.add(rail)
  }

  // ---- Wide flat arrays ----
  const panelFront = new THREE.MeshStandardMaterial({
    map: makeCellTexture(panel),
    // Tint multiplies the map, controlling how far the environment washes the
    // panel back toward neutral.
    color: panel.tint,
    metalness: panel.metalness,
    roughness: panel.roughness,
    envMapIntensity: panel.envMapIntensity,
    emissive: panel.emissive,
    emissiveIntensity: panel.emissiveIntensity,
  })
  const panelBack = new THREE.MeshStandardMaterial({
    color: 0xb8c2cf,
    metalness: 0.95,
    roughness: 0.22,
    envMapIntensity: 1.6,
  })

  const SEG_W = 2.3
  const SEG_D = 2.5
  const SEGS = 4
  const GAP = 0.07
  const segGeo = new THREE.BoxGeometry(SEG_W, 0.035, SEG_D)

  for (const side of [1, -1]) {
    for (let i = 0; i < SEGS; i++) {
      // Box face order: +x, -x, +y, -y, +z, -z. Cells face +y (sunward).
      const seg = new THREE.Mesh(segGeo, [
        panelBack,
        panelBack,
        panelFront,
        panelBack,
        panelBack,
        panelBack,
      ])
      seg.position.x = side * (BUS.W / 2 + SEG_W / 2 + i * (SEG_W + GAP))
      group.add(seg)

      const hinge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, SEG_D * 0.96, 8),
        aluDark
      )
      hinge.rotation.x = Math.PI / 2
      hinge.position.x = side * (BUS.W / 2 + i * (SEG_W + GAP) + SEG_W + GAP / 2)
      group.add(hinge)
    }
  }

  if (!lasers) return { group, beams: [] }

  // ---- Payload aperture ----
  const aperture = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.18, 0.16, 24),
    new THREE.MeshStandardMaterial({
      color: 0x11161f,
      metalness: 0.8,
      roughness: 0.18,
    })
  )
  aperture.position.set(0, -BUS.T / 2 - 0.08, BUS.D * 0.26)
  group.add(aperture)

  // ---- Downlink lasers ----
  // Three emitters fanned a few degrees apart in one plane, so their
  // footprints fall along a line — a push-broom scan rather than a single spot.
  //
  // Each fires a long pulse that shoots out from the aperture: the head runs
  // ahead, the tail follows, and the whole beam clears the frame. Meshes are
  // built as UNIT-length cylinders so the visible span can be scaled and
  // positioned per frame without rebuilding geometry.
  const LEN = 34

  function makeBeam(intensity: number): THREE.Group {
    const beam = new THREE.Group()

    const halo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.03, 1, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x2a6cff,
        transparent: true,
        opacity: 0.26 * intensity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    )
    halo.userData.baseOpacity = 0.26 * intensity
    beam.add(halo)

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.007, 1, 12),
      new THREE.MeshBasicMaterial({
        color: 0x8fc0ff,
        transparent: true,
        opacity: 0.9 * intensity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    core.userData.baseOpacity = 0.9 * intensity
    beam.add(core)

    // Bright head, so the leading edge reads as the shot rather than the tail.
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 10),
      new THREE.MeshBasicMaterial({
        color: 0xdcecff,
        transparent: true,
        opacity: intensity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    head.userData.baseOpacity = intensity
    beam.add(head)

    // Muzzle flare, fixed at the aperture while the pulse is leaving.
    const muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 14, 12),
      new THREE.MeshBasicMaterial({
        color: 0x9fcbff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    muzzle.userData.baseOpacity = 0.95 * intensity
    beam.add(muzzle)

    beam.userData.parts = { halo, core, head, muzzle }
    beam.userData.len = LEN

    return beam
  }

  // Fanning on Z keeps all three in one plane so the scan reads as a line.
  const FAN = [-0.13, 0, 0.13]
  const INTENSITY = [0.8, 1, 0.8]

  const beams = FAN.map((offset, i) => {
    const beam = makeBeam(INTENSITY[i])
    beam.position.copy(aperture.position)
    beam.rotation.set(0.3, 0, -0.62 + offset)
    group.add(beam)
    return beam
  })

  return { group, beams }
}

/** Seconds from trigger to the pulse fully clearing the frame. */
const SHOT_DURATION = 1.35
/** Fraction of the shot during which the head is still travelling. */
const HEAD_PHASE = 0.55
/** When the tail starts to follow. Its lag sets the pulse length. */
const TAIL_DELAY = 0.34
/** Seconds between one emitter firing and the next. */
const SHOT_STAGGER = 0.5
/** Full sequence length, including the pause after the third shot. */
const SHOT_CYCLE = 2.9

const easeOut = (x: number) => 1 - Math.pow(1 - x, 2.4)
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

/**
 * Advances the downlink.
 *
 * Each emitter fires a long pulse: the head accelerates away from the
 * aperture, the tail follows after a delay, and the gap between them is the
 * beam's visible length. The three emitters are staggered so only one is in
 * flight at a time and the scan sweeps across the fan.
 *
 * Passing `undefined` freezes the pulses at fixed points, which is what the
 * static lab tiles use.
 */
export function animateBeams(beams: THREE.Group[], time: number | undefined) {
  beams.forEach((beam, i) => {
    const parts = beam.userData.parts as
      | { halo: THREE.Mesh; core: THREE.Mesh; head: THREE.Mesh; muzzle: THREE.Mesh }
      | undefined
    const LEN = (beam.userData.len as number) ?? 30
    if (!parts) return

    let t: number | null
    if (time === undefined) {
      // A still: hold each pulse at a different point so the sequence is
      // legible in a single frame.
      t = 0.3 + i * 0.16
    } else {
      const local = (((time - i * SHOT_STAGGER) % SHOT_CYCLE) + SHOT_CYCLE) % SHOT_CYCLE
      t = local < SHOT_DURATION ? local / SHOT_DURATION : null
    }

    const setVisible = (v: boolean) => {
      parts.halo.visible = v
      parts.core.visible = v
      parts.head.visible = v
    }

    if (t === null) {
      setVisible(false)
      parts.muzzle.visible = false
      return
    }

    // Head and tail as fractions of the full path.
    const headP = easeOut(clamp01(t / HEAD_PHASE))
    const tailP = easeOut(clamp01((t - TAIL_DELAY) / (1 - TAIL_DELAY)))
    const span = headP - tailP

    if (span <= 0.001) {
      setVisible(false)
      parts.muzzle.visible = false
      return
    }

    setVisible(true)

    // Unit-length geometry: scale to the span, then centre it between head
    // and tail. Beam-local -Y points away from the spacecraft.
    const lenWorld = span * LEN
    const midWorld = (tailP + span / 2) * LEN

    for (const mesh of [parts.halo, parts.core]) {
      mesh.scale.y = lenWorld
      mesh.position.y = -midWorld
    }
    parts.head.position.y = -headP * LEN

    // Dim as the pulse recedes so it reads as travelling away.
    const fade = 1 - Math.pow(tailP, 1.8) * 0.7
    for (const mesh of [parts.halo, parts.core, parts.head]) {
      const mat = mesh.material as THREE.MeshBasicMaterial
      const base = mesh.userData.baseOpacity as number | undefined
      if (mat && base !== undefined) mat.opacity = base * fade
    }

    // Muzzle flare, only while the tail is still at the aperture.
    const flash = clamp01(1 - tailP / 0.25)
    parts.muzzle.visible = flash > 0.01
    const mmat = parts.muzzle.material as THREE.MeshBasicMaterial
    mmat.opacity = ((parts.muzzle.userData.baseOpacity as number) ?? 1) * flash
    parts.muzzle.scale.setScalar(0.7 + flash * 0.9)
  })
}

/** Frees every geometry and material under a root, including env scenes. */
export function disposeScene(...roots: THREE.Object3D[]) {
  const materials = new Set<THREE.Material>()
  for (const root of roots) {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const m = mesh.material
      if (Array.isArray(m)) m.forEach((x) => materials.add(x))
      else if (m) materials.add(m)
    })
  }
  materials.forEach((m) => {
    ;(m as THREE.MeshStandardMaterial).map?.dispose()
    m.dispose()
  })
}
