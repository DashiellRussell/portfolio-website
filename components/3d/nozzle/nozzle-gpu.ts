import {
  compute,
  effect,
  frame,
  init,
  sampler,
  storage,
  surface,
  target,
  texture,
  type Compute,
  type Effect,
  type Gpu,
  type Texture,
  type StorageBuffer,
  type Target,
  uniforms,
} from "vgpu"

import initShader from "./init.wgsl"
import stepShader from "./step.wgsl"
import deriveShader from "./derive.wgsl"
import projectShader from "./project.wgsl"
import flipStashShader from "./flip-stash.wgsl"
import flipPairShader from "./flip-pair.wgsl"
import visualShader from "./visual.wgsl"
import blurShader from "./blur.wgsl"
import displayShader from "./display.wgsl"
import type { QualityTier } from "../quality/quality"
import { qualityProbe, qualityState, subscribeQuality } from "../quality/store"

/**
 * WebGPU port of the nozzle startup simulation (public/sims/nozzle.html), run
 * through vgpu and drawn straight into the host page's canvas.
 *
 * Same solver, same look as the embedded WebGL page with the options the site
 * uses (embed, visual glow on both halves, clean, lite, res=low, speed=120,
 * warm, flow, frost, flushleft). What changes is where the cost lands:
 *
 *  - the solver is a compute kernel that runs a whole RK2 step per dispatch:
 *    each workgroup loads its tile once into shared memory, keeps the
 *    intermediate stage there, and solves every face flux once, instead of
 *    two fragment passes that rebuilt each flux twice from ~16 texture reads
 *    per cell;
 *  - a frame's ~120 solver dispatches are recorded into one command buffer
 *    with fixed bind groups and nothing set between them, instead of ~240
 *    framebuffer binds, program switches and ~2,600 uniform calls;
 *  - pipelines compile asynchronously before the first frame, so mounting the
 *    card never blocks on shader compilation;
 *  - no iframe: no second document, layout pass or font load per card;
 *  - the glow is integrated in sim space, not per pixel: the plume is
 *    axisymmetric, so a ray's glow depends only on where it crosses the axis
 *    plane. project.wgsl integrates that once per texel of a fixed half-plane
 *    grid at the solver's own resolution, and the screen pass is one bilinear
 *    fetch, so the costliest pass no longer scales with the canvas size;
 *  - the solver only runs while it has something to show. Like baked VFX in a
 *    game, it records a flipbook of its own steady output once (64 frames,
 *    one per 120 steps, which is what a full-speed frame advances), then plays
 *    that back on the wall clock with the live flicker noise on top, at the
 *    cost of the glow pass alone. When the pointer reaches into the flow the
 *    real solver resumes from where it stopped and crossfades in; once the
 *    gas has settled after the pointer leaves, it fades back to the loop.
 *    So the plume is always at full speed, even on a GPU that could never
 *    run 7,200 solver steps a second, and costs ~nothing while untouched.
 */

export interface NozzleOptions {
  /** Fire sideways from the left edge (desktop panel). Otherwise the sim's portrait/landscape layout. */
  horizontal: boolean
  /** Background as 0..1 RGB, so the edges fade into the host page. */
  bg: [number, number, number]
  /** 0..1 combustion turbulence. Default 0.5; 0 makes the solver deterministic (tests). */
  turb?: number
}

export interface NozzleController {
  /** Off screen (`false`): finish the warm-up without drawing, then idle. */
  setActive(active: boolean): void
  /** The visitor's pointer in client px, or `null` once it leaves. It becomes a probe in the flow. */
  pointer(at: { x: number; y: number } | null): void
  dispose(): void
  /** For tests: run `n` solver steps now, and read back the conserved state. */
  debug: {
    run(n: number): void
    state(): Promise<Float32Array>
    /** Draws one frame offscreen and returns its RGBA bytes (the canvas format's channel order). */
    snapshot(): Promise<{ pixels: Uint8Array; size: readonly [number, number]; format: string }>
    /** Places the probe directly, in sim units. */
    probe(pos: [number, number], vel: [number, number], strength: number): void
    grid: [number, number]
    /** The tier currently drawing (it lags a downgrade request until Low has compiled). */
    tier(): QualityTier
    /** What's drawing: warming up, recording the flipbook, playing it, or the live solver. */
    mode(): Mode
    /** Crossfade between live (0) and the flipbook (1). */
    blend(): number
    /** Runs one solver step and records the result as the next flipbook frame. */
    capture(): void
    /** Pins what the next draw shows: the crossfade weight and the flipbook frame. */
    show(blend: number, frame: number): void
  }
}

export type Mode = "warm" | "record" | "loop" | "live"

/* -------------------------------------------------------------- constants */

// Simulation (from the reference page). Units: domain lengths, ambient p = rho = 1.
const RD = 0.7 // simulated radial extent
const XD = 3.4 // simulated axial extent
const VR = 0.46 // displayed half-height
const T0 = 4.0 // chamber temperature / ambient
const SMAX = 7.0 // max signal speed for the CFL step
const CFL = 0.45
const RAMP = 0.3 // ignition pressure ramp, sim units
const NR = 112 // res=low
const P0 = 16 // chamber pressure / ambient

// Embed options the site passes.
const MAX_STEPS = 120 // speed=120 (High)
/** Low tier: the flow runs at about half speed, but stays smooth on a weak GPU. */
const MAX_STEPS_LOW = 60
const FPS = 28 // governor target
const MINSPF = 8
const WARM = 1.8 // sim units burned through in batches on ignition
const FLOW = 0.45 // flame flicker on the wall clock
const FROST = 0.85
/** Steps per frame while warming. The page used 900 on screen and 150 off; both now 150 off, 300 on. */
const WARM_STEPS_PRELOAD = 150
const WARM_STEPS_ACTIVE = 300
/** Rows in the per-stage parameter buffer: two RK stages per step, at the largest batch. */
const MAX_STAGES = 2 * Math.max(MAX_STEPS, MAX_STEPS_LOW, WARM_STEPS_ACTIVE)

const KEROLOX = { soot: 1.0, band: [0.3, 0.4, 1.0] as [number, number, number], bandK: 0.0, expo: 45.0 }

const TILE: [number, number] = [16, 8]

/** The projected glow covers x in [0, PROJ_SPAN[0]] (the longest displayed length) and |y| in [0, 0.5]. */
const PROJ_SPAN: [number, number] = [3.0, 0.5]
/**
 * Flipbook: frames recorded, and solver steps between them (one full-speed
 * frame's worth, so playing a frame per 1/60 s matches the live sim at full
 * speed). Frame to frame the flow already jitters with the chamber's pressure
 * flutter, so the loop needs no crossfade at its seam.
 */
const FLIP_FRAMES = 64
const FLIP_STEPS = MAX_STEPS
const FLIP_FPS = 60
/** Sim time to keep solving after the probe lets go, so the gas is back to steady before the loop takes over. */
const SETTLE = 1.0
/** Live <-> flipbook crossfade, in seconds. */
const BLEND_S = 0.35
/** A pointer that hasn't moved for this long stops probing, so the flow can settle back to the loop. */
const POINTER_IDLE_MS = 2000

/** Projection texels per sim unit: the solver's resolution on High, half that on Low. */
const projDensity = (t: QualityTier) => (t === "low" ? 0.5 : 1) * (NR / RD)

// Pointer probe: radius in sim units (the nozzle exit radius is ~0.1), and the
// fastest it can push the gas, in sim units per sim time (the core jet runs ~4).
const PROBE_R = 0.06
const PROBE_VMAX = 4

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/* -------------------------------------------------------------- the sim */

export async function startNozzle(canvas: HTMLCanvasElement, opts: NozzleOptions): Promise<NozzleController> {
  const gpu: Gpu = await init({ powerPreference: "high-performance" })
  let disposed = false
  let raf = 0
  let active = false
  const TURB = opts.turb ?? 0.5
  gpu.onError((e) => {
    const err = e as { code?: string; message?: string; detail?: unknown; cause?: unknown }
    console.error("[nozzle]", err.code, err.message, err.detail ?? "", String(err.cause ?? ""))
  })

  try {
    const H = RD / NR
    const NX = Math.round(XD / H)
    const DT = (CFL * H) / SMAX
    const groups: [number, number] = [Math.ceil(NX / TILE[0]), Math.ceil(NR / TILE[1])]
    // Shared by every kernel (vgpu's `uniforms(gpu)` default for values many
    // shaders read): one buffer, not a copy per compute.
    const grid = uniforms(gpu, { n: [NX, NR], h: H, dt: DT, t0: T0 })
    // The pointer probe changes once per frame and is read by both step
    // kernels, so it is shared too; each dispatch captures its current value.
    const probeU = uniforms(gpu, { pos: [0, 0], vel: [0, 0], radius: PROBE_R, strength: 0 })

    // Each dispatch runs a whole RK2 step (both stages, the intermediate state
    // kept in workgroup memory; see step.wgsl), so the state ping-pongs
    // between two buffers.
    const bytes = NX * NR * 16
    const A = storage(gpu, bytes)
    const C = storage(gpu, bytes)
    const fields = texture(gpu, {
      kind: "2d",
      size: [NX, NR],
      format: "rgba16float",
      usage: ["storage_binding", "texture_binding"],
    })

    // The flipbook covers the displayed region at the solver's resolution
    // (the grid starts at the origin, so texel (i, j) is cell (i, j)), with
    // two frames per texel: ~10 MB for 64 frames.
    const FLIP_SIZE: [number, number] = [Math.round(PROJ_SPAN[0] / H), Math.round(PROJ_SPAN[1] / H)]
    const flipGroups: [number, number] = [Math.ceil(FLIP_SIZE[0] / TILE[0]), Math.ceil(FLIP_SIZE[1] / TILE[1])]
    const flip = texture(gpu, {
      kind: "2d-array",
      size: FLIP_SIZE,
      layers: FLIP_FRAMES / 2,
      format: "rgba16float",
      usage: ["storage_binding", "texture_binding"],
    })
    const stash = texture(gpu, { kind: "2d", size: FLIP_SIZE, format: "rgba16float", usage: ["storage_binding", "texture_binding"] })
    const flipStash = compute(gpu, flipStashShader, { label: "nozzle.flip.stash", set: { fields, stashOut: stash } })
    const flipPair = compute(gpu, flipPairShader, { label: "nozzle.flip.pair", set: { cap: { layer: 0 }, fields, stash, flipOut: flip } })

    // Per-stage values (pressure, time, turbulence), one vec4 row per RK stage
    // (two per step), uploaded once per frame; the kernel indexes them with a
    // GPU step counter that alternates between two buffers (see step.wgsl).
    const params = storage(gpu, MAX_STAGES * 16, "read")
    const counterA = storage(gpu, 4)
    const counterB = storage(gpu, 4)
    const rows = new Float32Array(MAX_STAGES * 4)
    const zero = new Uint32Array(1)

    const mkStep = (src: StorageBuffer, dst: StorageBuffer, counterIn: StorageBuffer, counterOut: StorageBuffer) =>
      compute(gpu, stepShader, {
        label: "nozzle.step",
        set: { grid, probe: probeU, src, dst, params, counterIn, counterOut },
      })
    // parity 0: state in A, result in C; parity 1: state in C, result in A.
    // The step counter swaps buffers the same way.
    const steps: [Compute, Compute] = [mkStep(A, C, counterA, counterB), mkStep(C, A, counterB, counterA)]
    const derives = [A, C].map((src) => compute(gpu, deriveShader, { label: "nozzle.derive", set: { grid, src, fields } }))
    const reset = compute(gpu, initShader, { label: "nozzle.init", set: { grid, dst: A } })

    const linear = sampler(gpu, { minFilter: "linear", magFilter: "linear" })
    const view = surface(gpu, canvas, { dpr: 1, alphaMode: "opaque" })
    // Quality tier (vgpu's adaptive-quality pattern; components/3d/quality):
    //   High  glow projected at the solver's resolution with 24 samples, drawn at
    //         half resolution; up to 120 steps a frame
    //   Low   projection at half that resolution with 12 samples, drawn at
    //         quarter resolution; up to 60 steps a frame
    let tier: QualityTier = qualityState().effective
    const glowShift = () => (tier === "low" ? 2 : 1)
    const half = () => [Math.max(2, view.size[0] >> glowShift()), Math.max(2, view.size[1] >> glowShift())] as const
    const eighth = () => [Math.max(2, view.size[0] >> 3), Math.max(2, view.size[1] >> 3)] as const
    const twentieth = () => [Math.max(2, Math.round(view.size[0] / 20)), Math.max(2, Math.round(view.size[1] / 20))] as const
    const hdr = { format: "rgba16float" as GPUTextureFormat }
    const VT = target(gpu, { size: half(), ...hdr })
    const VB1a = target(gpu, { size: eighth(), ...hdr })
    const VB1b = target(gpu, { size: eighth(), ...hdr })
    const VB2a = target(gpu, { size: twentieth(), ...hdr })
    const VB2b = target(gpu, { size: twentieth(), ...hdr })

    // The glow projection (project.wgsl): fixed size per tier, so it never
    // follows the canvas. Low halves the texels each way and the ray samples.
    type Projection = { tex: Texture; kernel: Compute; groups: [number, number] }
    const mkProjection = (t: QualityTier): Projection => {
      const size: [number, number] = [Math.ceil(PROJ_SPAN[0] * projDensity(t)), Math.ceil(PROJ_SPAN[1] * projDensity(t))]
      const tex = texture(gpu, { kind: "2d", size, format: "rgba16float", usage: ["storage_binding", "texture_binding"] })
      const kernel = compute(gpu, projectShader, {
        label: `nozzle.project.${t}`,
        constants: { SAMPLES: t === "low" ? 12 : 24 },
        set: {
          proj: {
            size,
            span: PROJ_SPAN,
            ext: [NX * H, NR * H],
            band: KEROLOX.band,
            soot: KEROLOX.soot,
            bandK: KEROLOX.bandK,
            tK: 875,
            time: 0,
            turb: TURB,
            blend: 0,
            flipLayer: 0,
            flipHalf: 0,
          },
          fields,
          fieldSampler: linear,
          glowOut: tex,
          flip,
        },
      })
      return { tex, kernel, groups: [Math.ceil(size[0] / TILE[0]), Math.ceil(size[1] / TILE[1])] }
    }
    let projection = mkProjection(tier)
    const visual: Effect = effect(gpu, visualShader, {
      label: "nozzle.visual",
      set: { glowTex: projection.tex, glowSampler: linear },
    })
    const blur: Effect = effect(gpu, blurShader, { label: "nozzle.blur", set: { srcSampler: linear } })
    const display: Effect = effect(gpu, displayShader, {
      label: "nozzle.display",
      set: { glow: VT, bloomA: VB1b, bloomB: VB2b, linearSampler: linear },
    })

    // Compile every pipeline off the main thread before the first frame.
    await Promise.all([
      ...steps.map((s) => s.compile()),
      ...derives.map((d) => d.compile()),
      reset.compile(),
      flipStash.compile(),
      flipPair.compile(),
      projection.kernel.compile(),
      visual.compile(VT),
      blur.compile(VB1a),
      display.compile(view),
    ])

    /* ------------------------------------------------------------ layout */

    let XV = 3.0
    let ROT = false
    let FIT: [number, number, number] = [0, 0, 1]

    // The reference page's layout(), embed branch: no legend, no controls.
    function layout() {
      const cw = canvas.clientWidth
      const ch = canvas.clientHeight
      if (cw === 0 || ch === 0) return
      const [W, Hc] = view.size
      const dpr = W / cw
      const mobile = cw <= 700 || Math.min(cw, ch) <= 500
      ROT = opts.horizontal ? false : mobile ? ch > cw : ch > cw * 1.1
      XV = mobile && ROT ? 2.2 : 3.0
      const m = Math.max(10, cw * 0.02)
      const ax = m
      const ay = mobile ? Math.max(12, m) : m
      const aw = cw - 2 * m
      const ah = Math.max(60, ch - 8 - ay - m * 0.5)
      let s: number, ox: number, oy: number
      if (!ROT && opts.horizontal) {
        // flushleft: fill the width; the host feathers any vertical overflow
        s = cw / XV
        ox = 0
        oy = ch / 2
      } else if (!ROT) {
        s = Math.min(aw / XV, ah / (2 * VR))
        const dw = XV * s
        const dh = 2 * VR * s
        ox = ax + (aw - dw) / 2
        oy = ay + (ah - dh) / 2 + dh / 2
      } else {
        s = Math.min(aw / (2 * VR), ah / XV)
        const dw = 2 * VR * s
        const dh = XV * s
        ox = ax + (aw - dw) / 2 + dw / 2
        oy = ay + (ah - dh) / 2
      }
      FIT = [ox * dpr, (ch - oy) * dpr, s * dpr]

      VT.resize(half())
      VB1a.resize(eighth())
      VB1b.resize(eighth())
      VB2a.resize(twentieth())
      VB2b.resize(twentieth())
      display.set({ disp: { fit: FIT, rot: ROT ? 1 : 0, res: [W, Hc], xv: XV, vr: VR, bg: opts.bg, expo: KEROLOX.expo * Math.pow(16 / P0, 0.55), frost: FROST } })
      visual.set({
        vis: {
          fit: [(FIT[0] * VT.size[0]) / W, (FIT[1] * VT.size[1]) / Hc, (FIT[2] * VT.size[0]) / W],
          rot: ROT ? 1 : 0,
          span: PROJ_SPAN,
          xv: XV,
          height: VT.size[1],
        },
      })
    }
    // fires once now, then on every size change; targets and uniforms follow
    const offResize = view.onResize(layout)

    /* ------------------------------------------------------------ solver */

    let parity = 0
    let t = 0
    let tIgn = 0
    let p0 = 1
    let ignited = false

    /** One row of per-stage values, as the JS loop of the reference computed them. */
    function stageRow(i: number) {
      // chamber pressure "roughness": a few % of broadband flutter + slow chug
      const ph = t * 60
      const rough = ignited
        ? TURB * (0.035 * Math.sin(ph * 1.7 + Math.sin(ph * 0.31) * 2) + 0.025 * Math.sin(ph * 4.3 + 1.1) + 0.02 * (Math.random() - 0.5))
        : 0
      rows[i * 4] = Math.max(1, p0 * (1 + rough))
      rows[i * 4 + 1] = t
      rows[i * 4 + 2] = ignited ? TURB : 0
    }

    /*
     * The game loop's state. `mode` says who draws the plume:
     *   warm    the solver burns through the ignition transient (mostly off screen)
     *   record  the solver runs and every FLIP_STEPS steps becomes a flipbook frame
     *   loop    the flipbook plays; the solver is idle
     *   live    the pointer is in the flow, so the real solver runs
     * `blend` crossfades the glow's gas state from live (0) to the flipbook (1).
     */
    let mode: Mode = "warm"
    let blend = 0
    /** Flipbook playhead, in frames, on the wall clock. */
    let flipClock = 0
    /** Flipbook frames recorded so far (0..FLIP_FRAMES). */
    let flipCount = 0
    /** Solver steps since the last recorded frame. */
    let recSteps = 0
    /** Sim time before which the flow still carries a probe's disturbance. */
    let calmAt = 0

    /**
     * Encodes `n` solver steps and a field update into one compute pass, and
     * with `capture` stores the result as the next flipbook frame.
     */
    function solve(n: number, capture = false) {
      n = Math.min(n, MAX_STAGES / 2)
      // the host half of each step: the pressure schedule and per-stage values
      let par = parity
      for (let i = 0; i < n; i++) {
        if (ignited) {
          const te = t - tIgn
          if (te < RAMP) {
            const k = te / RAMP
            p0 = 1 + (P0 - 1) * k * k * (3 - 2 * k)
          } else p0 += (P0 - p0) * (1 - Math.exp(-DT / 0.05))
        }
        stageRow(2 * i)
        stageRow(2 * i + 1)
        t += DT
      }
      params.write(rows.subarray(0, n * 8))
      counterA.write(zero)
      const slot = capture && flipCount < FLIP_FRAMES ? flipCount++ : -1
      if (slot >= 0 && slot % 2 === 1) flipPair.set({ cap: { layer: slot >> 1 } })
      // the GPU half: n dispatches with fixed bindings, nothing set between them
      track(frame(gpu, (f) =>
        f.computePass({ label: "nozzle.solve" }, (pass) => {
          for (let i = 0; i < n; i++) {
            pass.dispatch(steps[par], groups[0], groups[1])
            par ^= 1
          }
          pass.dispatch(derives[par], groups[0], groups[1])
          // even frames wait in the stash; odd ones write the pair to a layer
          if (slot >= 0) pass.dispatch(slot % 2 === 0 ? flipStash : flipPair, flipGroups[0], flipGroups[1])
        })
      ))
      parity = par
    }

    function draw(out: Target = view) {
      track(frame(gpu, (f) => {
        const { kernel, groups: pg } = projection
        const fi = Math.floor(flipClock) % FLIP_FRAMES
        kernel.set({ proj: { time: (performance.now() / 1000) * FLOW, blend, flipLayer: fi >> 1, flipHalf: fi & 1 } })
        f.computePass({ label: "nozzle.project" }, (pass) => pass.dispatch(kernel, pg[0], pg[1]))
        f.pass(VT, visual)
        blur.set({ blur: { dir: [2 / VT.size[0], 0], out: VB1a.size }, src: VT })
        f.pass(VB1a, blur)
        blur.set({ blur: { dir: [0, 2 / VB1a.size[1]], out: VB1b.size }, src: VB1a })
        f.pass(VB1b, blur)
        blur.set({ blur: { dir: [2 / VB1b.size[0], 0], out: VB2a.size }, src: VB1b })
        f.pass(VB2a, blur)
        blur.set({ blur: { dir: [0, 2 / VB2a.size[1]], out: VB2b.size }, src: VB2a })
        f.pass(VB2b, blur)
        f.pass(out, display)
      }))
    }

    // Frames submitted but not yet finished on the GPU. A GPU that falls behind
    // would otherwise queue work every tick without bound; the loop waits a
    // tick instead, and the longer frame time makes the governor take fewer steps.
    let inFlight = 0
    function track(f: { done: Promise<void> }) {
      inFlight++
      const settle = () => void inFlight--
      f.done.then(settle, settle)
    }

    // ambient air at rest, then light the engine at once: the warm start skips
    // the startup transient so the plume is fully out on the first visible frame
    reset.dispatch(groups[0], groups[1])
    ignited = true
    tIgn = t

    /* ------------------------------------------------------------ pointer */

    // Client px -> sim (x, r), inverting the display transform in layout().
    let pointerAt: { x: number; y: number } | null = null
    let pointerMovedAt = 0
    /** The pointer, unless it has rested for POINTER_IDLE_MS: a parked cursor shouldn't keep the solver running. */
    const livePointer = () => (pointerAt && performance.now() - pointerMovedAt < POINTER_IDLE_MS ? pointerAt : null)
    let probePos: [number, number] | null = null
    const probeVel: [number, number] = [0, 0]
    let probeOn = 0
    let probeIdle = true
    function toSim(at: { x: number; y: number }): [number, number] | null {
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0) return null
      const dpr = view.size[0] / rect.width
      const fx = (at.x - rect.left) * dpr
      const fy = (rect.height - (at.y - rect.top)) * dpr
      const dx = (fx - FIT[0]) / FIT[2]
      const dy = (fy - FIT[1]) / FIT[2]
      const qx = ROT ? -dy : dx
      const qy = ROT ? dx : dy
      if (qx < 0 || qx > XV || Math.abs(qy) > VR) return null
      return [qx, Math.abs(qy)]
    }

    /** Moves the probe for this frame; `simDt` is the sim time this frame advances. */
    function updateProbe(realDt: number, simDt: number) {
      const p = livePointer()
      const at = p ? toSim(p) : null
      // ease in when the pointer arrives and out after it leaves (it stays where it left)
      probeOn += ((at ? 1 : 0) - probeOn) * Math.min(1, realDt * 8)
      if (probeOn < 0.002) probeOn = 0
      const k = Math.min(1, realDt * 12)
      for (const i of [0, 1] as const) {
        // a cursor sweeping across the window outruns the gas; cap it at jet speed
        const v = at && probePos && simDt > 0 ? clamp((at[i] - probePos[i]) / simDt, -PROBE_VMAX, PROBE_VMAX) : 0
        probeVel[i] += (v - probeVel[i]) * k
      }
      if (at) probePos = at
      const strength = probePos ? probeOn : 0
      if (strength === 0 && probeIdle) return
      probeIdle = strength === 0
      probeU.set({ pos: probePos ?? [0, 0], vel: [probeVel[0], probeVel[1]], strength })
    }

    /* -------------------------------------------------------------- loop */

    const warming = () => t - tIgn < WARM
    const maxSteps = () => (tier === "low" ? MAX_STEPS_LOW : MAX_STEPS)
    let spf = Math.max(12, MINSPF)
    let last = performance.now()
    let acc = 0
    let frames = 0
    let lastAdapt = last

    // Presented-frame health, judged against the governor's own target: the
    // governor sheds solver steps first, so Low is requested only when even
    // its lightest High frame cannot hold ~80% of that rate.
    const health = qualityProbe()
    let lastTick = performance.now()
    const sample = (now: number, rendered: boolean) => {
      health.frame({ deltaMs: now - lastTick, active: active && !document.hidden && !warming(), rendered, targetFps: FPS })
      lastTick = now
    }

    // High -> Low, once: build and compile the Low projection while High keeps
    // drawing, then swap (vgpu: never compile on the swap frame).
    let swapping = false
    const offQuality = subscribeQuality((q) => {
      if (q.effective !== "low" || tier === "low" || swapping || disposed) return
      swapping = true
      const low = mkProjection("low")
      void low.kernel
        .compile()
        .then(() => {
          if (disposed) {
            low.kernel.dispose()
            low.tex.dispose()
            return
          }
          const previous = projection
          tier = "low"
          projection = low
          visual.set({ glowTex: low.tex })
          layout() // glow target to quarter resolution
          previous.kernel.dispose()
          previous.tex.dispose()
          spf = Math.min(spf, maxSteps())
          health.reset()
        })
        .catch((err) => console.warn("[nozzle] Low tier unavailable, staying on High", err))
    })

    /**
     * Runs up to `budget` solver steps toward the flipbook, capturing a frame
     * every FLIP_STEPS steps once the flow is calm. Returns the steps taken.
     */
    function record(budget: number) {
      if (t < calmAt) {
        solve(budget)
        return budget
      }
      const n = Math.min(budget, FLIP_STEPS - recSteps)
      recSteps += n
      const capture = recSteps >= FLIP_STEPS
      if (capture) recSteps = 0
      solve(n, capture)
      if (flipCount >= FLIP_FRAMES) mode = "loop"
      return n
    }

    function loop(now: number) {
      if (disposed) return
      if (inFlight >= 4) {
        if (active) sample(now, false)
        raf = requestAnimationFrame(loop)
        return
      }
      if (mode === "warm" && !warming()) mode = "record"
      if (!active) {
        // off screen: finish the warm-up and the recording gently without
        // drawing, then stop scheduling frames until the card is in view
        last = now
        if (mode === "warm") solve(WARM_STEPS_PRELOAD)
        else if (mode === "record") record(FLIP_STEPS)
        else {
          // nobody is watching a live flow: hand straight back to the loop
          if (mode === "live") mode = "loop"
          blend = 1
          raf = 0
          return
        }
        raf = requestAnimationFrame(loop)
        return
      }
      // clamp so a long pause doesn't read as one huge slow frame and starve spf
      const fdt = Math.min(Math.max((now - last) / 1000, 0), 0.1)
      last = now

      // A pointer over the plume (or a probe still easing out) disturbs the
      // flow: the live solver takes over, and the flow counts as calm again
      // only SETTLE sim units after it lets go.
      const p = livePointer()
      const over = p !== null && toSim(p) !== null
      const disturbed = over || !probeIdle
      if (disturbed) {
        calmAt = t + SETTLE
        if (mode === "loop") mode = "live"
        if (mode === "record" && (flipCount > 0 || recSteps > 0)) {
          // don't bake a disturbance into the loop: start the recording over
          flipCount = 0
          recSteps = 0
        }
      } else if (mode === "live" && t >= calmAt) {
        mode = flipCount >= FLIP_FRAMES ? "loop" : "record"
      }

      // the solver runs while it is shown, or still fading out under the loop
      let n = 0
      if (mode === "warm") n = WARM_STEPS_ACTIVE
      else if (mode === "record") n = record(spf)
      else if (mode === "live" || blend < 1) n = spf
      updateProbe(fdt, n * DT)
      if (n > 0 && mode !== "record") solve(n)

      blend = clamp(blend + (mode === "loop" ? 1 : -1) * (fdt / BLEND_S), 0, 1)
      flipClock = (flipClock + fdt * FLIP_FPS) % FLIP_FRAMES
      draw()
      sample(now, true)

      // adapt steps/frame to hold the frame rate, judged only on frames that solved
      if (n > 0 && mode !== "warm") {
        acc += fdt
        frames++
      }
      if (now - lastAdapt > 350) {
        if (frames > 0) {
          const avg = acc / frames
          if (avg > 1 / (FPS * 0.82)) spf = Math.max(MINSPF, Math.floor(spf * 0.8))
          else if (avg < 1 / FPS) spf = Math.min(maxSteps(), Math.ceil(spf * 1.3) + 1)
        }
        acc = 0
        frames = 0
        lastAdapt = now
      }
      raf = requestAnimationFrame(loop)
    }

    const kick = () => {
      if (!raf && !disposed) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }

    const onVisibility = () => {
      if (!document.hidden) last = lastTick = performance.now()
    }
    document.addEventListener("visibilitychange", onVisibility)

    gpu.lost.then(() => {
      disposed = true
      cancelAnimationFrame(raf)
    })

    return {
      setActive(next) {
        active = next
        kick()
      },
      pointer(at) {
        if (at && (!pointerAt || at.x !== pointerAt.x || at.y !== pointerAt.y)) pointerMovedAt = performance.now()
        pointerAt = at
      },
      debug: {
        run: (n) => solve(n),
        snapshot: async () => {
          const shot = target(gpu, { size: view.size, format: view.format })
          draw(shot)
          const pixels = new Uint8Array(await shot.color.read({ mipLevel: 0, region: "all" }))
          return { pixels, size: view.size, format: view.format }
        },
        state: async () => new Float32Array(await (parity === 0 ? A : C).read()),
        probe: (pos, vel, strength) => {
          probeU.set({ pos, vel, strength })
        },
        grid: [NX, NR],
        tier: () => tier,
        mode: () => mode,
        blend: () => blend,
        capture: () => solve(1, true),
        show: (b, frame) => {
          blend = b
          flipClock = frame
        },
      },
      dispose() {
        if (disposed) return
        disposed = true
        cancelAnimationFrame(raf)
        offResize()
        offQuality()
        health.dispose()
        document.removeEventListener("visibilitychange", onVisibility)
        gpu.dispose()
      },
    }
  } catch (err) {
    disposed = true
    cancelAnimationFrame(raf)
    gpu.dispose()
    throw err
  }
}
