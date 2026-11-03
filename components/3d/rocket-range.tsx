"use client"

import { useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { NozzleSim, NOZZLE_BG } from "./nozzle-sim"

/**
 * UNSW Rocketry: a static-fire test range.
 *
 * Two layers:
 *   1. the nozzle solver (an iframe), firing sideways across the top of the
 *      panel, kept above the heading;
 *   2. a transparent orthographic three.js layer over the whole panel, in
 *      panel pixels: cold vapour pouring off the engine, the pad with range
 *      markings, and a guided rocket lying on cradles in the foreground.
 *
 * The vapour has to come off the engine the solver draws, so `simLayout`
 * repeats the sim page's own layout maths (its `layout()`, embed branch) for
 * the iframe's box.
 */

// Where the iframe sits in the panel, as fractions: full width (the sim pins
// its engine to the left edge with `flushleft`), short enough that the plume
// clears the heading below it.
type Box = { left: number; top: number; width: number; height: number }
const SIM_BOX: Box = { left: 0, top: 0, width: 1, height: 0.66 }

/**
 * Engine placement in panel pixels: origin at the injector face, `s` px per
 * sim unit. Mirrors the sim page's `layout()` in `flushleft` mode: the 3-unit
 * window is scaled to the iframe's full width and centred vertically.
 */
function simLayout(W: number, H: number, box: Box) {
  const cw = W * box.width
  const ch = H * box.height
  const s = cw / 3
  return { ox: W * box.left, oy: H * box.top + ch / 2, s }
}

// Engine outline in sim units (from the solver's GEO block): outer radius of
// the chamber wall, and where the exit plane is.
const R_CHAMBER = 0.113
const X_EXIT = 0.5
const TILT = 0.55 // floor tilt toward the camera, radians

/* --------------------------------------------------------------- materials */

const M = {
  steel: new THREE.MeshStandardMaterial({ color: "#3b4048", metalness: 0.85, roughness: 0.35 }),
  steelDark: new THREE.MeshStandardMaterial({ color: "#22262c", metalness: 0.8, roughness: 0.45 }),
  hazard: new THREE.MeshStandardMaterial({ color: "#e2b21c", metalness: 0.1, roughness: 0.6 }),
  pipe: new THREE.MeshStandardMaterial({ color: "#a7adb6", metalness: 1, roughness: 0.25 }),
  cell: new THREE.MeshStandardMaterial({ color: "#c63b2b", metalness: 0.4, roughness: 0.4 }),
  body: new THREE.MeshStandardMaterial({ color: "#e6e8ec", metalness: 0.15, roughness: 0.38 }),
  black: new THREE.MeshStandardMaterial({ color: "#16181c", metalness: 0.5, roughness: 0.4 }),
  blue: new THREE.MeshStandardMaterial({ color: "#2f6fd6", metalness: 0.2, roughness: 0.4 }),
  orange: new THREE.MeshStandardMaterial({ color: "#ff7a1a", metalness: 0.2, roughness: 0.4 }),
  fin: new THREE.MeshStandardMaterial({ color: "#c9ccd2", metalness: 0.7, roughness: 0.3 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: "#cfe6ff", metalness: 0, roughness: 0.04, transparent: true, opacity: 0.28, clearcoat: 1, depthWrite: false,
  }),
  seeker: new THREE.MeshStandardMaterial({ color: "#0d0f12", metalness: 0.6, roughness: 0.2 }),
  gold: new THREE.MeshStandardMaterial({ color: "#d4a548", metalness: 1, roughness: 0.25 }),
  pin: new THREE.MeshStandardMaterial({ color: "#d61f1f", metalness: 0.3, roughness: 0.4 }),
  cradle: new THREE.MeshStandardMaterial({ color: "#5a5f68", metalness: 0.6, roughness: 0.5 }),
  bay: new THREE.MeshStandardMaterial({ color: "#0b0c0f", metalness: 0.3, roughness: 0.8, side: THREE.DoubleSide }),
}

const BOX = new THREE.BoxGeometry(1, 1, 1)
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 32)

/* ------------------------------------------------------------ cryo vapour */

/**
 * Cold vapour boiling off the cryogenic hardware: soft sprites that peel off
 * each source, sink (it is denser than air), spread along the pad and fade.
 */
function CryoVapour({ sources, floor, scale }: { sources: THREE.Vector3[]; floor: number; scale: number }) {
  const N = 170
  const { geo, mat, state } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(N * 3)
    const size = new Float32Array(N)
    const alpha = new Float32Array(N)
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1))
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {},
      vertexShader: `attribute float aSize; attribute float aAlpha; varying float vA;
        void main(){ vA=aAlpha; gl_PointSize=aSize; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying float vA;
        void main(){ vec2 d=gl_PointCoord-0.5; float r=dot(d,d)*4.0; if(r>1.0) discard;
          gl_FragColor=vec4(0.86,0.92,1.0, vA*(1.0-r)*(1.0-r)); }`,
    })
    const state = Array.from({ length: N }, () => ({ age: 0, life: 0, vx: 0, vy: 0 }))
    return { geo, mat, state }
  }, [])
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])

  const spawn = (i: number, stagger: boolean) => {
    const src = sources[Math.floor(Math.random() * sources.length)]
    const p = geo.attributes.position as THREE.BufferAttribute
    p.setXYZ(i, src.x + (Math.random() - 0.5) * 14 * scale, src.y + (Math.random() - 0.5) * 6 * scale, src.z + 20)
    const st = state[i]
    st.life = 2.2 + Math.random() * 2.2
    st.age = stagger ? Math.random() * st.life : 0
    st.vx = (Math.random() - 0.5) * 10 * scale
    st.vy = -(14 + Math.random() * 18) * scale
  }

  useEffect(() => {
    for (let i = 0; i < N; i++) spawn(i, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources])

  useFrame((_, dt) => {
    const p = geo.attributes.position as THREE.BufferAttribute
    const sz = geo.attributes.aSize as THREE.BufferAttribute
    const al = geo.attributes.aAlpha as THREE.BufferAttribute
    const step = Math.min(dt, 0.05)
    for (let i = 0; i < N; i++) {
      const st = state[i]
      st.age += step
      if (st.age >= st.life) { spawn(i, false); continue }
      let x = p.getX(i) + st.vx * step
      let y = p.getY(i) + st.vy * step
      if (y < floor) { y = floor; st.vy = 0; st.vx *= 1.02; st.vx += (st.vx >= 0 ? 6 : -6) * step * scale }
      else st.vy -= 4 * step * scale // gentle sinking acceleration
      p.setXY(i, x, y)
      const k = st.age / st.life
      sz.setX(i, (14 + 110 * k) * scale)
      // faint and growing: wisps read as vapour, bright small sprites read as smoke balls
      al.setX(i, 0.1 * Math.sin(Math.PI * Math.min(1, k * 1.1)))
    }
    p.needsUpdate = sz.needsUpdate = al.needsUpdate = true
  })

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />
}

/**
 * Cold vapour pouring off the engine: LOX chill-down frosts the injector end
 * and the chamber, and the boil-off spills over the top and sinks off the
 * underside to pool on the pad. Sources sit on the sim's own engine outline.
 */
function EngineCryo({ ox, oy, s, ground }: { ox: number; oy: number; s: number; ground: number }) {
  const { size } = useThree()
  const sources = useMemo(() => {
    const P = (x: number, y: number) => new THREE.Vector3(x - size.width / 2, size.height / 2 - y, 0)
    const rc = R_CHAMBER * s
    const pts: THREE.Vector3[] = []
    // along the chamber, top and bottom, densest at the injector end
    for (const k of [0, 0.03, 0.06, 0.09, 0.12, 0.15]) {
      pts.push(P(ox + k * s, oy + rc), P(ox + k * s, oy + rc), P(ox + k * s, oy - rc))
    }
    // and off the converging section into the throat
    pts.push(P(ox + 0.2 * s, oy + rc * 0.75), P(ox + 0.24 * s, oy + rc * 0.58))
    return pts
  }, [ox, oy, s, size.width, size.height])
  return <CryoVapour sources={sources} floor={size.height / 2 - ground + 0.01 * s} scale={s / 430} />
}

/* ------------------------------------------------------------------ floor */

/** Concrete pad, expansion joints, a keep-out stripe and range markings under the plume. */
function useFloorTexture(W: number, ox: number, s: number, depth: number) {
  return useMemo(() => {
    const cw = 2048
    const chh = 1024
    const c = document.createElement("canvas")
    c.width = cw
    c.height = chh
    const g = c.getContext("2d")!
    const worldW = W * 3
    const X = (localX: number) => ((localX + worldW / 2) / worldW) * cw
    const Z = (z: number) => (z / depth) * chh

    g.fillStyle = "#16181d"
    g.fillRect(0, 0, cw, chh)
    // aggregate speckle
    let seed = 7
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
    for (let i = 0; i < 9000; i++) {
      const l = 20 + rand() * 18
      g.fillStyle = `rgba(${l},${l + 1},${l + 4},0.5)`
      g.fillRect(rand() * cw, rand() * chh, 2, 2)
    }
    // expansion joints every 4 m (1 m = exit diameter = 0.192 sim units)
    const metre = 0.192 * s
    g.strokeStyle = "rgba(0,0,0,0.55)"
    g.lineWidth = 3
    for (let x = -worldW / 2; x < worldW / 2; x += metre * 4) {
      g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), chh); g.stroke()
    }
    for (let z = metre * 4; z < depth; z += metre * 4) {
      g.beginPath(); g.moveTo(0, Z(z)); g.lineTo(cw, Z(z)); g.stroke()
    }
    // keep-out stripe along the stand
    const localOx = ox - W / 2
    const x0 = X(localOx - 0.4 * s)
    const x1 = X(localOx + 0.35 * s)
    g.save()
    g.beginPath(); g.rect(x0, Z(4), x1 - x0, Z(18)); g.clip()
    g.fillStyle = "#e2b21c"; g.fillRect(x0, Z(4), x1 - x0, Z(18))
    g.fillStyle = "#111"
    for (let x = x0 - 60; x < x1; x += 28) {
      g.beginPath(); g.moveTo(x, Z(22)); g.lineTo(x + 14, Z(22)); g.lineTo(x + 30, Z(4)); g.lineTo(x + 16, Z(4)); g.fill()
    }
    g.restore()
    // range markings: 0-10 m downrange of the exit plane, a tick per metre
    g.fillStyle = "rgba(230,232,236,0.7)"
    g.font = "600 17px ui-monospace, monospace"
    g.textAlign = "center"
    const exit = localOx + X_EXIT * s
    for (let m = 0; m <= 10; m++) {
      const x = X(exit + m * metre)
      g.fillRect(x - 1, Z(30), 2, m % 5 === 0 ? Z(26) : Z(14))
      if (m % 5 === 0) g.fillText(`${m} m`, x, Z(30) + Z(46))
    }
    g.fillRect(X(exit), Z(30), X(exit + 10 * metre) - X(exit), 2)

    const map = new THREE.CanvasTexture(c)
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8

    // fade the far edge into the sim background and the sides into the page
    const f = document.createElement("canvas")
    f.width = 256
    f.height = 128
    const fg = f.getContext("2d")!
    const v = fg.createLinearGradient(0, 0, 0, 128)
    v.addColorStop(0, "#000")
    v.addColorStop(0.3, "#fff")
    v.addColorStop(1, "#fff")
    fg.fillStyle = v
    fg.fillRect(0, 0, 256, 128)
    fg.globalCompositeOperation = "multiply"
    const h = fg.createLinearGradient(0, 0, 256, 0)
    h.addColorStop(0, "#000")
    h.addColorStop(0.3, "#fff")
    h.addColorStop(0.75, "#fff")
    h.addColorStop(1, "#000")
    fg.fillStyle = h
    fg.fillRect(0, 0, 256, 128)
    return { map, alpha: new THREE.CanvasTexture(f) }
  }, [W, ox, s, depth])
}

/* ---------------------------------------------------------------- missile */

/** Red REMOVE BEFORE FLIGHT streamer texture. */
function useStreamerTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 64
    c.height = 512
    const g = c.getContext("2d")!
    g.fillStyle = "#c8161d"
    g.fillRect(0, 0, 64, 512)
    g.save()
    g.translate(32, 256)
    g.rotate(Math.PI / 2)
    g.fillStyle = "#fff"
    g.font = "700 30px ui-sans-serif, system-ui"
    g.textAlign = "center"
    g.textBaseline = "middle"
    g.fillText("REMOVE BEFORE FLIGHT", 0, 0)
    g.restore()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

/**
 * A guided test round lying on two cradles: glass seeker dome over a
 * gimballed seeker, ogive, airbrakes mid-body, four actuated aft fins,
 * launch lugs, and pull pins with streamers. Built along +X (nose), in px.
 */
const BRAKE_LEN = 40
const BRAKE_W = 0.95 // radians of circumference per panel

function GuidedRocket(props: ThreeElements["group"]) {
  const L = 520
  const R = 24
  const nose0 = L / 2 - 110 // ogive start
  const nose1 = L / 2 - 26 // ogive end / dome seat
  const aft = -L / 2 + 40

  const seeker = useRef<THREE.Group>(null)
  const brakes = useRef<THREE.Group[]>([])
  const fins = useRef<THREE.Group[]>([])
  const streamers = useRef<THREE.Mesh[]>([])
  const streamerMap = useStreamerTexture()

  const { ogive, fin, boattail, nozzle, brakePanel, brakeBay } = useMemo(() => {
    // a curved strip of skin centred on +Y, axis along X: cylinder theta is
    // measured from +Z, and rotateZ(-90deg) maps that to -Y, hence the offset
    const arc = (r: number, w: number) => {
      const g = new THREE.CylinderGeometry(r, r, BRAKE_LEN * (w / BRAKE_W), 16, 1, true, -Math.PI / 2 - w / 2, w)
      g.rotateZ(-Math.PI / 2)
      return g
    }
    const brakePanel = arc(R + 0.6, BRAKE_W)
    const brakeBay = arc(R + 0.25, BRAKE_W * 1.06)
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      pts.push(new THREE.Vector2(R * (1 - 0.28 * Math.pow(t, 1.6)), t * (nose1 - nose0)))
    }
    const ogive = new THREE.LatheGeometry(pts, 40)
    ogive.rotateZ(-Math.PI / 2)
    const shape = new THREE.Shape()
    shape.moveTo(10, 0)
    shape.lineTo(-62, 0)
    shape.lineTo(-56, 46)
    shape.lineTo(-24, 46)
    shape.closePath()
    const fin = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false })
    fin.translate(0, 0, -1.5)
    const boattail = new THREE.CylinderGeometry(R, R * 0.82, 30, 40)
    boattail.rotateZ(Math.PI / 2)
    const nozzle = new THREE.CylinderGeometry(R * 0.5, R * 0.7, 18, 32, 1, true)
    nozzle.rotateZ(Math.PI / 2)
    return { ogive, fin, boattail, nozzle, brakePanel, brakeBay }
  }, [nose0, nose1])
  useEffect(
    () => () => [ogive, fin, boattail, nozzle, brakePanel, brakeBay].forEach((g) => g.dispose()),
    [ogive, fin, boattail, nozzle, brakePanel, brakeBay]
  )

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (seeker.current) {
      seeker.current.rotation.y = Math.sin(t * 0.9) * 0.45
      seeker.current.rotation.z = Math.sin(t * 0.63 + 1) * 0.35
    }
    // airbrakes: small, continuous trim movements around a part-open set point
    const deploy = 0.08 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.1)) + 0.025 * Math.sin(t * 3.7)
    brakes.current.forEach((b) => b && (b.rotation.z = -deploy))
    // fins: a guidance-loop dither, opposite pairs in roll
    fins.current.forEach((f, i) => f && (f.rotation.y = Math.sin(t * 2.1 + (i % 2) * Math.PI) * 0.28 + Math.sin(t * 5.3 + i) * 0.05))
    streamers.current.forEach((m, i) => {
      if (!m) return
      m.rotation.x = Math.sin(t * 3 + i * 1.7) * 0.03
      m.rotation.z = Math.sin(t * 2.2 + i) * 0.02
    })
  })

  const ring = (x: number, w: number, mat: THREE.Material) => (
    <mesh geometry={CYL} material={mat} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[R * 2.02, w, R * 2.02]} />
  )
  const streamer = (i: number, position: [number, number, number]) => (
    <group position={position}>
      <mesh geometry={CYL} material={M.pin} scale={[2.2, 14, 2.2]} position={[0, 7, 0]} />
      <mesh
        ref={(m) => { if (m) streamers.current[i] = m }}
        position={[0, 14, 0]}
      >
        <mesh position={[0, -2, 30]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 64]} />
          <meshStandardMaterial map={streamerMap} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      </mesh>
    </group>
  )

  const xBrake = 30
  const xFin = aft + 22
  return (
    <group {...props}>
      {/* airframe */}
      <mesh geometry={CYL} material={M.body} position={[(nose0 + aft) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[R * 2, nose0 - aft, R * 2]} />
      <mesh geometry={ogive} material={M.body} position={[nose0, 0, 0]} />
      <mesh geometry={boattail} material={M.body} position={[aft - 15, 0, 0]} />
      <mesh geometry={nozzle} material={M.black} position={[aft - 38, 0, 0]} />
      {ring(nose0 - 16, 10, M.blue)}
      {ring(nose0 - 30, 4, M.black)}
      {ring(xBrake - 34, 8, M.orange)}
      {ring(aft + 70, 4, M.black)}

      {/* seeker: glass dome over a gimballed head */}
      <group position={[nose1, 0, 0]}>
        <mesh material={M.glass}>
          <sphereGeometry args={[R * 0.72, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <group rotation={[0, 0, -Math.PI / 2]}>
          <mesh material={M.glass} rotation={[0, 0, 0]}>
            <sphereGeometry args={[R * 0.72, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
        <group ref={seeker}>
          <mesh geometry={CYL} material={M.seeker} rotation={[0, 0, Math.PI / 2]} position={[4, 0, 0]} scale={[R * 0.9, 4, R * 0.9]} />
          <mesh material={M.gold} position={[6.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[R * 0.36, 1.2, 8, 32]} />
          </mesh>
          <mesh material={M.glass} position={[7, 0, 0]}>
            <sphereGeometry args={[R * 0.22, 16, 12]} />
          </mesh>
        </group>
      </group>

      {/* airbrakes: skin panels flush with the airframe, hinged at the forward
          edge; opening one exposes the dark bay cut into the body beneath it */}
      {[0, 1, 2, 3].map((i) => (
        <group key={`b${i}`} rotation={[i * (Math.PI / 2) + Math.PI / 4, 0, 0]}>
          <mesh geometry={brakeBay} material={M.bay} position={[xBrake, 0, 0]} />
          <group ref={(g) => { if (g) brakes.current[i] = g }} position={[xBrake + BRAKE_LEN / 2, R, 0]}>
            <mesh geometry={brakePanel} material={M.body} position={[-BRAKE_LEN / 2, -R, 0]} />
          </group>
        </group>
      ))}

      {/* aft control fins, each rotating about its own radial axis */}
      {[0, 1, 2, 3].map((i) => (
        <group key={`f${i}`} rotation={[i * (Math.PI / 2) + Math.PI / 4, 0, 0]}>
          <group ref={(g) => { if (g) fins.current[i] = g }} position={[xFin - 24, R, 0]}>
            <mesh geometry={fin} material={M.fin} position={[24, 0, 0]} />
          </group>
        </group>
      ))}

      {/* launch lugs */}
      <mesh geometry={BOX} material={M.black} position={[-90, R + 3, 0]} scale={[16, 6, 8]} />
      <mesh geometry={BOX} material={M.black} position={[110, R + 3, 0]} scale={[16, 6, 8]} />

      {/* safety pins with streamers: airbrake lock, fin lock, seeker cover */}
      <group rotation={[-0.35, 0, 0]}>
        {streamer(0, [xBrake - 10, R, 0])}
        {streamer(1, [xFin - 10, R, 0])}
        {streamer(2, [nose0 + 20, R * 0.9, 0])}
      </group>

      {/* cradles */}
      {[-120, 110].map((x) => (
        <group key={x} position={[x, -R, 0]}>
          <mesh geometry={BOX} material={M.cradle} position={[0, -12, 0]} scale={[26, 10, R * 2.6]} />
          <mesh geometry={BOX} material={M.cradle} position={[0, -2, R * 0.75]} rotation={[0.7, 0, 0]} scale={[22, 6, R * 0.9]} />
          <mesh geometry={BOX} material={M.cradle} position={[0, -2, -R * 0.75]} rotation={[-0.7, 0, 0]} scale={[22, 6, R * 0.9]} />
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------- scene */

function Environment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.4
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

/** The plume's own light on the stand, floor and rocket, flickering with the burn. */
function PlumeLight({ x, y, s }: { x: number; y: number; s: number }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    if (!light.current) return
    const t = state.clock.getElapsedTime()
    light.current.intensity = 2.4 + Math.sin(t * 23) * 0.25 + Math.sin(t * 7.3) * 0.35
  })
  return <pointLight ref={light} position={[x, y, s * 0.6]} color="#ff9a4a" decay={0} intensity={2.4} />
}

function Range() {
  const { size } = useThree()
  const W = size.width
  const H = size.height
  const { ox, oy, s } = simLayout(W, H, SIM_BOX)
  const ground = oy + R_CHAMBER * s + 0.27 * s
  const depth = Math.max(400, (H - ground) / Math.sin(TILT) + 80)
  const { map, alpha } = useFloorTexture(W, ox, s, depth)
  useEffect(() => () => { map.dispose(); alpha.dispose() }, [map, alpha])

  const toWorld = (x: number, y: number) => [x - W / 2, H / 2 - y] as const
  const [gx, gy] = toWorld(W / 2, ground)
  const [px, py] = toWorld(ox + (X_EXIT + 0.4) * s, oy)

  // the rocket scales with the panel, but never past a sensible size
  const rocketScale = THREE.MathUtils.clamp(W / 1440, 0.45, 1.15)

  return (
    <>
      <Environment />
      <ambientLight intensity={0.35} color="#8fa8c8" />
      <directionalLight position={[-400, 900, 800]} intensity={1.6} color="#e8eef8" />
      <PlumeLight x={px} y={py} s={s} />
      <EngineCryo ox={ox} oy={oy} s={s} ground={ground} />
      <group position={[gx, gy, 0]} rotation={[TILT, 0, 0]}>
        <mesh position={[0, 0, depth / 2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
          <planeGeometry args={[W * 3, depth]} />
          <meshStandardMaterial map={map} alphaMap={alpha} color="#5c6068" transparent depthWrite={false} roughness={0.95} metalness={0} envMapIntensity={0.3} />
        </mesh>
        <GuidedRocket
          position={[W * 0.16, 24 * rocketScale + 17 * rocketScale, depth * 0.52]}
          rotation={[0, -0.32, 0]}
          scale={rocketScale}
        />
      </group>
    </>
  )
}

export function RocketRange() {
  return (
    <div style={{ position: "absolute", inset: 0, background: `#${NOZZLE_BG}` }}>
      <NozzleSim
        style={{
          position: "absolute",
          left: `${SIM_BOX.left * 100}%`,
          top: `${SIM_BOX.top * 100}%`,
          width: `${SIM_BOX.width * 100}%`,
          height: `${SIM_BOX.height * 100}%`,
          // at wide aspects the plume's glow overflows the box; feather it out
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 12%, #000 82%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 12%, #000 82%, transparent 100%)",
        }}
      />
      <Canvas
        orthographic
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 3000], zoom: 1, near: 1, far: 8000 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.AgXToneMapping
          gl.toneMappingExposure = 1.2
        }}
      >
        <Range />
      </Canvas>
    </div>
  )
}

export default RocketRange
