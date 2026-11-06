"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber"
import { PerformanceMonitor, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { observeVisibility } from "@/lib/canvas"
import { useOnScreenActive } from "@/components/space/on-screen"
import { useIsMobile } from "@/components/space/use-mobile"
import { Prewarm, fastShaders } from "./prewarm"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

/**
 * Phase Robotics bench — a robotics lab in a box: the CYRA arm, the stator
 * winder, and a range of round drive boards.
 *
 * Both CAD models are exported from their source assemblies and
 * meshopt-compressed (see `public/models`):
 *   - the arm is split into link_0..link_3 by the rules in cyra-web's
 *     `config/link-map.json`, each mesh baked in world space, so joints are
 *     pivots built here at the actuator centres;
 *   - the winder keeps its own materials, with the flyer (`spinner`) and the
 *     motor pulley (`pulley`) under hinge nodes on their Z axes.
 *
 * The boards are procedural on purpose: they stand in for a product range, not
 * a specific PCB, so they carry no part numbers or real layouts.
 */

const ARM_URL = "/models/cyra-arm.glb"
const WINDER_URL = "/models/stator-winder.glb"

// Bench layout (metres): arm on the left, winder on the right, boards between.
const ARM_POS: [number, number, number] = [-0.42, 0.002, -0.1]
const WINDER_POS: [number, number, number] = [0.92, 0, -0.32]
// shown larger than life so it holds its own next to the arm
const WINDER_SCALE = 1.6


/** Pointer over the panel, normalised to -1..1 with +y up (as R3F's `mouse`). */
type Pointer = { x: number; y: number; inside: boolean }

/* --------------------------------------------------------------------- arm */

// Actuator centres from the CYRA STEP (metres, arm frame: Y up, reach along -Z).
// The arm lies in the YZ plane, so both pitch joints turn about X.
const J2 = new THREE.Vector3(0, 0.189, 0.0635)
const J3 = new THREE.Vector3(0, 0.463, -0.17)

// Gripper: three fingers, each hinged at its worm gear on a ring around the
// wrist's forward axis. Each hinge turns about the ring's tangent, so a
// positive angle swings the tip inward.
const GRIP_AXIS = new THREE.Vector2(0.0014, 0.4802)
const FINGER_HINGES = [
  new THREE.Vector3(0.009, 0.5142, -0.5726),
  new THREE.Vector3(-0.0324, 0.4699, -0.5633),
  new THREE.Vector3(0.0277, 0.4566, -0.5625),
]

const FINGER_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#ff7a1a",
  metalness: 0.15,
  roughness: 0.38,
  emissive: "#ff5a00",
  emissiveIntensity: 0.12,
})

/** One grip cycle: roll and open together, then close and hold. */
const GRIP_PERIOD = 4.2
const GRIP_ROLL = Math.PI / 2

function armMaterial(src: THREE.MeshStandardMaterial) {
  // The export carries two greys: a cool blue-grey for printed housings and a
  // neutral for hardware. Keep that split, but as satin anodised tones.
  const housing = src.color.b > src.color.r + 0.1
  return new THREE.MeshStandardMaterial({
    color: housing ? "#d9dde6" : "#3a3d45",
    metalness: housing ? 0.15 : 0.75,
    roughness: housing ? 0.42 : 0.35,
  })
}

/** Rebuilds the arm as a joint chain: link_0 → J1 (yaw) → J2 → J3 (pitch). */
function useArmRig() {
  const { scene } = useGLTF(ARM_URL)
  return useMemo(() => {
    const src = scene.clone(true)
    src.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      // creased normals are baked into the GLB at export (32 deg), not computed here
      let finger = false
      o.traverseAncestors((a) => (finger ||= a.name.startsWith("finger_")))
      mesh.material = finger ? FINGER_MATERIAL : armMaterial(mesh.material as THREE.MeshStandardMaterial)
    })
    const link = (i: number) => src.getObjectByName(`link_${i}`)!

    const root = new THREE.Group()
    const j1 = new THREE.Group()
    const j2 = new THREE.Group()
    const j3 = new THREE.Group()
    j2.position.copy(J2)
    j3.position.copy(J3).sub(J2)

    // links are in arm-world coords, so each is offset back by its pivot
    const l0 = link(0)
    const l1 = link(1)
    const l2 = link(2)
    const l3 = link(3)
    l2.position.copy(J2).negate()
    l3.position.copy(J3).negate()

    root.add(l0, j1)
    j1.add(l1, j2)
    j2.add(l2, j3)
    j3.add(l3)

    // the hand rolls about the wrist's forward axis, carrying the fingers
    const hand = l3.getObjectByName("hand")!
    const wrist = new THREE.Group()
    wrist.position.set(GRIP_AXIS.x, GRIP_AXIS.y, 0)
    hand.position.set(-GRIP_AXIS.x, -GRIP_AXIS.y, 0)
    wrist.add(hand)
    l3.add(wrist)

    const fingers = FINGER_HINGES.map((hinge, i) => {
      const f = hand.getObjectByName(`finger_${i}`)!
      const pivot = new THREE.Group()
      pivot.position.copy(hinge)
      f.position.copy(hinge).negate()
      pivot.add(f)
      hand.add(pivot)
      const radial = new THREE.Vector2(hinge.x, hinge.y).sub(GRIP_AXIS).normalize()
      return { pivot, axis: new THREE.Vector3(-radial.y, radial.x, 0) }
    })
    return { root, j1, j2, j3, wrist, fingers }
  }, [scene])
}

/**
 * Behaves like the hero arm on the main site: while the pointer is over the
 * panel the base swings with x and the shoulder and elbow counter-rotate with
 * y; otherwise it breathes gently. Every joint eases toward its target.
 */
function Arm({ pointer, still }: { pointer: React.RefObject<Pointer>; still: boolean }) {
  const { root, j1, j2, j3, wrist, fingers } = useArmRig()

  useFrame((state) => {
    if (still) return
    const t = state.clock.getElapsedTime()
    const p = pointer.current
    let base: number, shoulder: number, elbow: number
    if (p.inside) {
      base = (p.x * Math.PI) / 3
      // positive pitch lifts the reach, so pointer up raises the arm
      shoulder = (p.y * Math.PI) / 10
      elbow = (p.y * Math.PI) / 5
    } else {
      base = Math.sin(t * 0.5) * 0.1
      shoulder = Math.sin(t * 0.5) * 0.06
      elbow = 0
    }
    j1.rotation.y = THREE.MathUtils.lerp(j1.rotation.y, base, 0.1)
    j2.rotation.x = THREE.MathUtils.lerp(j2.rotation.x, shoulder, 0.1)
    j3.rotation.x = THREE.MathUtils.lerp(j3.rotation.x, elbow, 0.1)

    // first half of each cycle: roll a quarter turn while the fingers splay;
    // second half: collapse shut. The roll keeps accumulating cycle to cycle.
    const cycle = t / GRIP_PERIOD
    const u = cycle % 1
    const ease = (x: number) => x * x * (3 - 2 * x)
    const opening = u < 0.5 ? ease(u * 2) : 1 - ease((u - 0.5) * 2)
    wrist.rotation.z = (Math.floor(cycle) + (u < 0.5 ? ease(u * 2) : 1)) * GRIP_ROLL
    // -0.5 rad splayed, +0.08 just closed
    const grip = 0.08 - opening * 0.58
    for (const f of fingers) f.pivot.quaternion.setFromAxisAngle(f.axis, grip)
  })

  return <primitive object={root} position={ARM_POS} rotation={[0, -2.52, 0]} />
}

/* ------------------------------------------------------------------ winder */

/** Flyer speed; the 30T motor pulley turns 100/30 as fast through the belt. */
const FLYER_RAD_S = 15

/**
 * One coil per cycle, the way the machine works: wind with the flyer, spin
 * down, slide the carriage back off the stator guide on the lead screw, index
 * the stator one tooth on the rod motor, slide back in, spin up. Times in s.
 */
const WIND = { wind: 3.2, spinDown: 0.4, retract: 0.6, index: 0.6, engage: 0.6, spinUp: 0.4 }
const WIND_PERIOD = Object.values(WIND).reduce((a, b) => a + b, 0)
const RETRACT_M = 0.035 // clears the guide, which reaches 8 mm into the stator's path
const TOOTH = (Math.PI * 2) / 18

function Winder({ still }: { still: boolean }) {
  const { scene } = useGLTF(WINDER_URL)
  const parts = useMemo(() => {
    const root = scene.clone(true)
    const get = (n: string) => root.getObjectByName(n)
    // the status bar is a gauge: an unlit copy shows its full length, the lit
    // one scales from its left end with coil progress
    const led = get("led")
    if (led) {
      const unlit = led.clone(true)
      unlit.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) m.material = new THREE.MeshStandardMaterial({ color: "#0d1a12", roughness: 0.6 })
      })
      unlit.position.z -= 0.0002
      led.parent?.add(unlit)
    }
    return { root, spinner: get("spinner"), pulley: get("pulley"), carriage: get("carriage"), stator: get("stator"), led }
  }, [scene])
  const { root, spinner, pulley, carriage, stator, led } = parts

  useFrame((state, dt) => {
    if (still) return
    const t = state.clock.getElapsedTime()
    const cycle = Math.floor(t / WIND_PERIOD)
    let u = t % WIND_PERIOD
    const ease = (x: number) => x * x * (3 - 2 * x)
    // phase -> flyer speed (0..1), carriage travel (0..1), index progress (0..1)
    let speed = 0, slide = 0, index = 0, coil = 0
    if ((u -= WIND.wind) < 0) { speed = 1; coil = 1 + u / WIND.wind }
    else if ((u -= WIND.spinDown) < 0) { speed = 1 - ease(1 + u / WIND.spinDown); coil = 1 }
    else if ((u -= WIND.retract) < 0) { slide = ease(1 + u / WIND.retract); coil = 1 }
    else if ((u -= WIND.index) < 0) { slide = 1; index = ease(1 + u / WIND.index); coil = 1 - index }
    else if ((u -= WIND.engage) < 0) { slide = 1 - ease(1 + u / WIND.engage); index = 1 }
    else { index = 1; speed = ease(1 + (u - WIND.spinUp) / WIND.spinUp) }

    if (spinner) spinner.rotation.z += FLYER_RAD_S * speed * dt
    if (pulley) pulley.rotation.z += FLYER_RAD_S * (100 / 30) * speed * dt
    if (carriage) carriage.position.z = RETRACT_M * slide
    if (stator) stator.rotation.y = (cycle + index) * TOOTH
    // coil progress: fills while winding, full through the retract, drains as the stator indexes
    if (led) led.scale.x = Math.max(0.001, coil)
  })

  // Exported in metres, Y up, origin at the front-left foot; recentred here.
  return (
    <group position={WINDER_POS} rotation={[0, -0.5 - THREE.MathUtils.degToRad(10), 0]} scale={WINDER_SCALE}>
      <primitive object={root} position={[-0.105, 0, 0.215]} />
    </group>
  )
}

/* ------------------------------------------------------------------ boards */

/** Small deterministic PRNG so every board lays out the same on every load. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const MASK = new THREE.MeshStandardMaterial({ color: "#0b2a1a", roughness: 0.8, metalness: 0, envMapIntensity: 0.35 })
const EDGE = new THREE.MeshStandardMaterial({ color: "#2c3a2a", roughness: 0.8 })
const GOLD = new THREE.MeshStandardMaterial({ color: "#d4a548", roughness: 0.25, metalness: 1 })
const IC = new THREE.MeshStandardMaterial({ color: "#121214", roughness: 0.55, metalness: 0.2 })
const CERAMIC = new THREE.MeshStandardMaterial({ color: "#8a7458", roughness: 0.5 })
const ALU = new THREE.MeshStandardMaterial({ color: "#b8bcc4", roughness: 0.3, metalness: 0.9 })
const PLASTIC = new THREE.MeshStandardMaterial({ color: "#d9a441", roughness: 0.55 })
const LED = new THREE.MeshStandardMaterial({ color: "#9b6bff", emissive: "#9b6bff", emissiveIntensity: 2.2 })

const box = new THREE.BoxGeometry(1, 1, 1)
const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 24)
const disc = new THREE.CylinderGeometry(0.5, 0.5, 1, 72)

type Part = { geo: THREE.BufferGeometry; mat: THREE.Material; p: [number, number, number]; s: [number, number, number] }

/**
 * A generic round motor-drive board: MCU, gate driver, a bank of FETs with
 * three phase pads, bulk caps, a battery connector, passives and a status LED.
 * Radius in metres; the board lies in XZ with components on +Y.
 */
function boardParts(r: number, seed: number): Part[] {
  const rand = rng(seed)
  const t = 0.0016
  const top = t / 2
  const parts: Part[] = []
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, p: [number, number, number], s: [number, number, number]) =>
    parts.push({ geo, mat, p, s })
  const inside = (x: number, z: number, m: number) => Math.hypot(x, z) < r - m

  // mounting holes on a ring at 45°
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2
    add(cyl, GOLD, [Math.cos(a) * (r - 0.004), top + 0.00005, Math.sin(a) * (r - 0.004)], [0.0042, 0.0001, 0.0042])
  }

  // MCU module with its RF can, left of centre
  const mcu = r * 0.42
  const mx = -r * 0.36
  add(box, IC, [mx, top + 0.0004, r * 0.05], [mcu, 0.0008, mcu * 1.1])
  add(box, ALU, [mx, top + 0.0012, r * 0.08], [mcu * 0.86, 0.0008, mcu * 0.9])

  // gate driver at the centre
  add(box, IC, [r * 0.05, top + 0.0004, r * 0.12], [r * 0.16, 0.0008, r * 0.16])

  // FET bank down the right, with the three phase pads at the edge
  const fets = Math.max(2, Math.round((r * 1.1) / 0.0075))
  for (let i = 0; i < fets; i++) {
    const z = -r * 0.55 + (r * 1.1 * (i + 0.5)) / fets
    add(box, IC, [r * 0.4, top + 0.0005, z], [0.005, 0.001, 0.0055])
  }
  for (let i = 0; i < 3; i++) add(cyl, GOLD, [r * 0.72, top + 0.0001, (i - 1) * r * 0.28], [0.0045, 0.0002, 0.0045])

  // bulk caps either side of the battery connector at the top edge
  const capH = 0.006 + r * 0.06
  for (const s of [-1, 1]) {
    add(cyl, ALU, [s * r * 0.36, top + capH / 2, -r * 0.62], [0.0075, capH, 0.0075])
    add(cyl, IC, [s * r * 0.36, top + capH + 0.0001, -r * 0.62], [0.0076, 0.0003, 0.0076])
  }
  add(box, PLASTIC, [0, top + 0.004, -r * 0.82], [r * 0.42, 0.008, r * 0.36])

  // 0603 passives, kept off the big parts
  for (let i = 0; i < Math.round(r * r * 26000); i++) {
    const x = (rand() - 0.5) * 2 * r
    const z = (rand() - 0.5) * 2 * r
    if (!inside(x, z, 0.004)) continue
    if (Math.abs(x - mx) < mcu * 0.62 && Math.abs(z - r * 0.05) < mcu * 0.66) continue
    if (x > r * 0.3 || z < -r * 0.45) continue
    const turn = rand() > 0.5
    add(box, rand() > 0.6 ? IC : CERAMIC, [x, top + 0.0003, z], turn ? [0.0016, 0.0006, 0.0008] : [0.0008, 0.0006, 0.0016])
  }

  add(box, LED, [-r * 0.1, top + 0.0004, r * 0.62], [0.0016, 0.0007, 0.0009])
  return parts
}

/** Bakes every part into one geometry per material: a handful of draw calls per board, not hundreds. */
function mergeParts(parts: Part[]) {
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>()
  const m = new THREE.Matrix4()
  for (const p of parts) {
    m.compose(new THREE.Vector3(...p.p), new THREE.Quaternion(), new THREE.Vector3(...p.s))
    const g = p.geo.clone().applyMatrix4(m)
    byMat.set(p.mat, [...(byMat.get(p.mat) ?? []), g])
  }
  return [...byMat].map(([mat, geos]) => ({ mat, geo: mergeGeometries(geos)! }))
}

const boardCache = new Map<string, ReturnType<typeof mergeParts>>()

function Board({ r, seed, ...props }: { r: number; seed: number } & ThreeElements["group"]) {
  // shared across instances of the same board; lives as long as the page
  const merged = useMemo(() => {
    const key = `${r}:${seed}`
    if (!boardCache.has(key)) boardCache.set(key, mergeParts(boardParts(r, seed)))
    return boardCache.get(key)!
  }, [r, seed])
  const t = 0.0016
  return (
    <group {...props}>
      <mesh geometry={disc} material={MASK} scale={[r * 2, t, r * 2]} />
      <mesh geometry={disc} material={EDGE} scale={[r * 2 + 0.0002, t * 0.6, r * 2 + 0.0002]} />
      {merged.map(({ mat, geo }) => (
        <mesh key={mat.uuid} geometry={geo} material={mat} />
      ))}
    </group>
  )
}

/**
 * Three piles of boards on the floor, one per size, each stacked a little
 * askew. Boards in a pile share one merged geometry set.
 */
const PILES = [
  { r: 0.02, seed: 7, count: 5, at: [-0.15, 0.03] },
  { r: 0.028, seed: 19, count: 4, at: [0.0, -0.04] },
  { r: 0.038, seed: 41, count: 3, at: [0.165, 0.01] },
] as const

function BoardPiles() {
  return (
    <group position={[0.0, 0, 0.22]} rotation={[0, -0.3, 0]} scale={2.4}>
      {PILES.map((pile) => {
        const rand = rng(pile.seed * 13)
        // board plus its tallest part (the bulk caps), so boards rest on the caps
        const step = 0.0016 + 0.006 + pile.r * 0.06 + 0.0004
        return (
          <group key={pile.seed} position={[pile.at[0], 0.0008, pile.at[1]]}>
            {Array.from({ length: pile.count }, (_, i) => (
              <Board
                key={i}
                r={pile.r}
                seed={pile.seed}
                position={[(rand() - 0.5) * pile.r * 0.25, i * step, (rand() - 0.5) * pile.r * 0.25]}
                rotation={[(rand() - 0.5) * 0.05, rand() * Math.PI * 2, (rand() - 0.5) * 0.05]}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}

/* -------------------------------------------------------------------- apple */

const APPLE_SKIN = new THREE.MeshStandardMaterial({ color: "#b3121b", roughness: 0.35, metalness: 0 })
const APPLE_STEM = new THREE.MeshStandardMaterial({ color: "#4a3420", roughness: 0.8 })
const APPLE_LEAF = new THREE.MeshStandardMaterial({ color: "#3d7a2a", roughness: 0.6, side: THREE.DoubleSide })

/** A lathed apple, about 8 cm across — the thing the arm was built to pick. */
function Apple(props: ThreeElements["group"]) {
  const { body, leaf } = useMemo(() => {
    const prof: THREE.Vector2[] = []
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI
      // dimpled top and bottom, fuller shoulders
      const r = Math.sin(a) * (0.04 + 0.004 * Math.sin(a * 2 - 0.6))
      const y = 0.036 - Math.cos(a) * 0.036 - Math.sin(a * 2) * 0.0035
      prof.push(new THREE.Vector2(Math.max(r, 0.0001), 0.072 - y))
    }
    const body = new THREE.LatheGeometry(prof.reverse(), 40)
    const leafShape = new THREE.Shape()
    leafShape.moveTo(0, 0)
    leafShape.quadraticCurveTo(0.012, 0.008, 0.028, 0)
    leafShape.quadraticCurveTo(0.012, -0.008, 0, 0)
    const leaf = new THREE.ShapeGeometry(leafShape)
    return { body, leaf }
  }, [])
  useEffect(() => () => { body.dispose(); leaf.dispose() }, [body, leaf])
  return (
    <group {...props}>
      <mesh geometry={body} material={APPLE_SKIN} />
      <mesh geometry={cyl} material={APPLE_STEM} position={[0.001, 0.075, 0]} rotation={[0, 0, -0.25]} scale={[0.003, 0.016, 0.003]} />
      <mesh geometry={leaf} material={APPLE_LEAF} position={[0.003, 0.078, 0]} rotation={[0.5, 0.4, 0.35]} />
    </group>
  )
}

/* ------------------------------------------------------- stators & motors */

const STATOR_STEEL = new THREE.MeshStandardMaterial({ color: "#0f6b38", metalness: 0.35, roughness: 0.4 })
const COPPER = new THREE.MeshStandardMaterial({ color: "#c4642a", metalness: 0.9, roughness: 0.25 })
const BELL = new THREE.MeshStandardMaterial({ color: "#16181d", metalness: 0.8, roughness: 0.32 })
const BELL_RING = new THREE.MeshStandardMaterial({ color: "#ff7a1a", metalness: 0.5, roughness: 0.35 })
const STEEL = new THREE.MeshStandardMaterial({ color: "#c9ccd2", metalness: 1, roughness: 0.2 })

/**
 * Outrunner stator lamination: teeth point outward from a yoke ring, each
 * ending in a shoe, with a bore through the middle. Dimensions in metres;
 * lies flat in XZ.
 */
function statorGeometry(teeth: number, r: number, h: number) {
  const yoke = r * 0.62
  const shoeIn = r * 0.86
  const bore = r * 0.36
  const pitch = (Math.PI * 2) / teeth
  const stem = pitch * 0.16
  const shoe = pitch * 0.4
  const shape = new THREE.Shape()
  const at = (rad: number, a: number) => new THREE.Vector2(Math.cos(a) * rad, Math.sin(a) * rad)
  for (let i = 0; i < teeth; i++) {
    const c = i * pitch
    const pts = [
      at(yoke, c - stem), at(shoeIn, c - stem), at(shoeIn, c - shoe),
      at(r, c - shoe), at(r, c + shoe), at(shoeIn, c + shoe),
      at(shoeIn, c + stem), at(yoke, c + stem),
    ]
    pts.forEach((p, j) => (i === 0 && j === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y)))
  }
  shape.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, bore, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 6 })
  g.rotateX(-Math.PI / 2)
  return g
}

/** Copper wound round each tooth stem, as one merged geometry. */
function coilGeometry(teeth: number, r: number, h: number) {
  const pitch = (Math.PI * 2) / teeth
  const len = r * 0.24
  const coils = Array.from({ length: teeth }, (_, i) => {
    const g = new THREE.BoxGeometry(len, h * 1.5, pitch * r * 0.55)
    g.translate(r * 0.74, h / 2, 0)
    g.rotateY(-i * pitch)
    return g
  })
  return mergeGeometries(coils)!
}

function Stator({ teeth, r, h, wound, ...props }: { teeth: number; r: number; h: number; wound: boolean } & ThreeElements["group"]) {
  const lam = useMemo(() => statorGeometry(teeth, r, h), [teeth, r, h])
  const coil = useMemo(() => (wound ? coilGeometry(teeth, r, h) : null), [teeth, r, h, wound])
  useEffect(() => () => { lam.dispose(); coil?.dispose() }, [lam, coil])
  return (
    <group {...props}>
      <mesh geometry={lam} material={STATOR_STEEL} position={[0, wound ? h * 0.25 : 0, 0]} />
      {coil ? <mesh geometry={coil} material={COPPER} /> : null}
    </group>
  )
}

/** A drone-class outrunner: bell with a coloured band, vented cap, shaft, mount. */
function DroneMotor({ r, h, ...props }: { r: number; h: number } & ThreeElements["group"]) {
  const vents = useMemo(() => {
    const g = mergeGeometries(
      Array.from({ length: 5 }, (_, i) => {
        const v = new THREE.BoxGeometry(r * 0.5, 0.0006, r * 0.22)
        v.translate(r * 0.5, 0, 0)
        v.rotateY((i * Math.PI * 2) / 5)
        return v
      })
    )!
    return g
  }, [r])
  useEffect(() => () => vents.dispose(), [vents])
  return (
    <group {...props}>
      <mesh geometry={cyl} material={STEEL} position={[0, h * 0.06, 0]} scale={[r * 1.7, h * 0.12, r * 1.7]} />
      <mesh geometry={cyl} material={BELL} position={[0, h * 0.58, 0]} scale={[r * 2, h * 0.84, r * 2]} />
      <mesh geometry={cyl} material={BELL_RING} position={[0, h * 0.4, 0]} scale={[r * 2.02, h * 0.1, r * 2.02]} />
      <mesh geometry={vents} material={STEEL} position={[0, h + 0.0003, 0]} />
      <mesh geometry={cyl} material={STEEL} position={[0, h + h * 0.18, 0]} scale={[r * 0.28, h * 0.36, r * 0.28]} />
    </group>
  )
}

/** Parts laid out on the floor around the boards, like a bench mid-build. */
function Parts() {
  const S = 2.4 // same display scale as the boards
  return (
    <group scale={S}>
      <Stator teeth={18} r={0.03} h={0.008} wound position={[0.17, 0, 0.21]} rotation={[0, 0.4, 0]} />
      <Stator teeth={12} r={0.014} h={0.006} wound={false} position={[0.26, 0, 0.11]} rotation={[0, 0.2, 0]} />
      <Stator teeth={12} r={0.014} h={0.006} wound position={[-0.13, 0, 0.23]} rotation={[0, 1.1, 0]} />
      <Stator teeth={12} r={0.014} h={0.006} wound={false} position={[-0.126, 0.006, 0.23]} rotation={[0, 0.3, 0]} />
      <DroneMotor r={0.014} h={0.02} position={[0.06, 0, 0.27]} rotation={[0, 0.5, 0]} />
      <DroneMotor r={0.014} h={0.02} position={[0.3, 0, 0.2]} />
      <DroneMotor r={0.014} h={0.02} position={[-0.21, 0, 0.12]} rotation={[0, 2, 0]} />
    </group>
  )
}

/* ------------------------------------------------------------------- scene */

function Lighting() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.45
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  return (
    <>
      <ambientLight intensity={0.15} color="#8fa8c8" />
      <directionalLight
        position={[1.2, 2.2, 1.4]}
        intensity={2.6}
        color="#fff1e0"
      />
      {/* violet rim from behind: the zone accent */}
      <directionalLight position={[-1.5, 0.8, -2]} intensity={2.4} color="#9b6bff" />
      <pointLight position={[0.6, 0.5, -0.2]} intensity={0.5} color="#9b6bff" distance={1.2} />
    </>
  )
}

/**
 * Soft contact shadows as textured quads. Real shadow maps re-render the whole
 * scene from the light every frame; these cost one draw each.
 */
function useBlobTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas")
    c.width = c.height = 128
    const ctx = c.getContext("2d")!
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, "rgba(0,0,0,0.75)")
    g.addColorStop(0.5, "rgba(0,0,0,0.35)")
    g.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
}

/**
 * Bench floor variants, all on a 4 m plate that fades out to the page
 * background so the scene never has a hard edge.
 *   grid       — matte plate, faint violet 10 cm grid
 *   tiles      — 40 cm lab floor tiles with grout and a little tone variation
 *   breadboard — optical-table plate, a hole every 50 mm
 */
type FloorVariant = "grid" | "tiles" | "breadboard"
const FLOOR: FloorVariant = "grid"

function paintFloor(g: CanvasRenderingContext2D, size: number, variant: FloorVariant) {
  const plate = 4 // metres across the texture
  const px = (m: number) => (m / plate) * size
  if (variant === "grid") {
    g.fillStyle = "#14161c"
    g.fillRect(0, 0, size, size)
    g.strokeStyle = "rgba(155,107,255,0.16)"
    g.lineWidth = 2
    for (let i = 0; i <= 40; i++) {
      const x = px(i * 0.1)
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, size); g.stroke()
      g.beginPath(); g.moveTo(0, x); g.lineTo(size, x); g.stroke()
    }
  } else if (variant === "tiles") {
    const rand = rng(99)
    const tile = px(0.4)
    g.fillStyle = "#060709" // grout
    g.fillRect(0, 0, size, size)
    for (let y = 0; y < size; y += tile)
      for (let x = 0; x < size; x += tile) {
        const l = 30 + Math.round(rand() * 12)
        g.fillStyle = `rgb(${l},${l + 1},${l + 5})`
        g.fillRect(x + 4, y + 4, tile - 8, tile - 8)
      }
  } else {
    // anodised plate with a faint brushed grain, then the hole grid
    g.fillStyle = "#24262d"
    g.fillRect(0, 0, size, size)
    const rand = rng(5)
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(255,255,255,${0.012 + rand() * 0.02})`
      g.fillRect(0, rand() * size, size, 1)
    }
    const pitch = px(0.05)
    g.fillStyle = "#040405"
    for (let y = pitch / 2; y < size; y += pitch)
      for (let x = pitch / 2; x < size; x += pitch) {
        g.beginPath(); g.arc(x, y, pitch * 0.2, 0, Math.PI * 2); g.fill()
      }
  }
}

function Floor({ variant }: { variant: FloorVariant }) {
  const { map, alpha } = useMemo(() => {
    const size = 1024
    const tex = document.createElement("canvas")
    tex.width = tex.height = size
    paintFloor(tex.getContext("2d")!, size, variant)
    const fade = document.createElement("canvas")
    fade.width = fade.height = 256
    const f = fade.getContext("2d")!
    const r = f.createRadialGradient(128, 128, 0, 128, 128, 128)
    r.addColorStop(0, "#fff")
    r.addColorStop(0.45, "#bbb")
    r.addColorStop(1, "#000")
    f.fillStyle = r
    f.fillRect(0, 0, 256, 256)
    const map = new THREE.CanvasTexture(tex)
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
    return { map, alpha: new THREE.CanvasTexture(fade) }
  }, [variant])
  useEffect(() => () => { map.dispose(); alpha.dispose() }, [map, alpha])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0, -0.1]} renderOrder={-1}>
      <planeGeometry args={[4, 4]} />
      <meshStandardMaterial
        map={map}
        alphaMap={alpha}
        transparent
        depthWrite={false}
        roughness={variant === "breadboard" ? 0.55 : 0.85}
        metalness={variant === "breadboard" ? 0.5 : 0.1}
      />
    </mesh>
  )
}

function Blob({ position, scale }: { position: [number, number, number]; scale: [number, number] }) {
  const map = useBlobTexture()
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[scale[0], scale[1], 1]}>
      <planeGeometry />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  )
}

const TARGET = new THREE.Vector3(0.18, 0.25, -0.1)
const OFFSET = new THREE.Vector3(-0.45, 0.62, 2.7)

/**
 * Frames the bench for the panel's aspect. Wide panels keep the copy column
 * clear on the left; portrait panels pull back and centre so the arm is not
 * cropped to a single link.
 */
function Framing({ armOnly }: { armOnly: boolean }) {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    const target = TARGET.clone()
    let back = aspect < 1 ? Math.min(1.75, 0.88 / aspect) : 1
    if (armOnly) {
      // phones: the arm alone, centred, aimed low so it sits above the copy
      target.set(ARM_POS[0] + 0.12, 0.1, ARM_POS[2])
      back = Math.min(1.4, 0.66 / aspect)
    } else if (aspect < 1) {
      // portrait: centre, and aim low so the bench sits above the copy
      target.set(0.15, -0.32, -0.05)
    }
    camera.position.copy(target).addScaledVector(OFFSET, back)
    camera.lookAt(target)
    camera.updateProjectionMatrix()
  }, [camera, size, armOnly])
  return null
}

export function RoboticsBench({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  const still =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const wrap = useRef<HTMLDivElement>(null)
  const pointer = useRef<Pointer>({ x: 0, y: 0, inside: false })
  const [visible, setVisible] = useState(false)
  // prepared off screen by OnScreen, animated only once it is in view
  const active = useOnScreenActive()
  const mobile = useIsMobile()
  // start sharp, drop to 1x if the frame rate can't keep up, climb back when it can
  const [dpr, setDpr] = useState(1.5)

  // Stop rendering entirely while the panel is scrolled away.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    return observeVisibility(el, setVisible)
  }, [])

  // The copy is layered over the canvas, so the canvas never sees the pointer;
  // track it on the window and test against the panel's own rect instead.
  // Touch has no hover: a tap or drag on the card aims the arm, which holds
  // the pose for a moment after the finger lifts, then eases back to idle.
  useEffect(() => {
    if (still) return
    let release: ReturnType<typeof setTimeout> | undefined
    const aim = (cx: number, cy: number) => {
      const el = wrap.current
      if (!el) return false
      const r = el.getBoundingClientRect()
      const p = pointer.current
      p.inside = cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom
      p.x = THREE.MathUtils.clamp(((cx - r.left) / r.width) * 2 - 1, -1, 1)
      p.y = THREE.MathUtils.clamp(-(((cy - r.top) / r.height) * 2 - 1), -1, 1)
      return p.inside
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") aim(e.clientX, e.clientY)
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t || !aim(t.clientX, t.clientY)) return
      clearTimeout(release)
    }
    const onTouchEnd = () => {
      clearTimeout(release)
      release = setTimeout(() => (pointer.current.inside = false), 2200)
    }
    const onLeave = () => (pointer.current.inside = false)
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("touchstart", onTouch, { passive: true })
    window.addEventListener("touchmove", onTouch, { passive: true })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    document.addEventListener("pointerleave", onLeave)
    return () => {
      clearTimeout(release)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("touchstart", onTouch)
      window.removeEventListener("touchmove", onTouch)
      window.removeEventListener("touchend", onTouchEnd)
      document.removeEventListener("pointerleave", onLeave)
    }
  }, [still])

  return (
    // an unsized parent gives the Canvas zero height, so fill by default
    <div ref={wrap} className={className} style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        frameloop={visible && active && !still ? "always" : "demand"}
        dpr={dpr}
        camera={{ fov: 34, near: 0.01, far: 20 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          fastShaders(gl)
          gl.toneMapping = THREE.AgXToneMapping
          gl.toneMappingExposure = 1.3
        }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <Framing armOnly={mobile} />
        <Lighting />
        {/* phones get the arm alone; the rest of the bench is desktop-only */}
        <Suspense fallback={null}>
          <Arm pointer={pointer} still={still} />
          {mobile ? null : <Winder still={still} />}
          <Prewarm />
        </Suspense>
        {mobile ? null : (
          <>
            <BoardPiles />
            <Apple position={[0.56, 0, 0.48]} rotation={[0.12, 0.8, 0.05]} />
            <Parts />
          </>
        )}
        <Floor variant={FLOOR} />
        <Blob position={ARM_POS} scale={[0.42, 0.42]} />
        {mobile ? null : <Blob position={[WINDER_POS[0], 0.002, WINDER_POS[2]]} scale={[0.62, 0.85]} />}
      </Canvas>
    </div>
  )
}

useGLTF.preload(ARM_URL)
useGLTF.preload(WINDER_URL)

export default RoboticsBench
