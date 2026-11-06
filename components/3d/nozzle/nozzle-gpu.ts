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
  type StorageBuffer,
  type Target,
  uniforms,
} from "vgpu"

import initShader from "./init.wgsl"
import stepShader from "./step.wgsl"
import deriveShader from "./derive.wgsl"
import visualShader from "./visual.wgsl"
import blurShader from "./blur.wgsl"
import displayShader from "./display.wgsl"

/**
 * WebGPU port of the nozzle startup simulation (public/sims/nozzle.html), run
 * through vgpu and drawn straight into the host page's canvas.
 *
 * Same solver, same look as the embedded WebGL page with the options the site
 * uses (embed, visual glow on both halves, clean, lite, res=low, speed=120,
 * warm, flow, frost, flushleft). What changes is where the cost lands:
 *
 *  - the solver is a compute kernel that loads each tile once into shared
 *    memory and solves every face once, instead of a fragment pass that
 *    rebuilt each flux twice from ~16 texture reads per cell;
 *  - a frame's ~240 solver dispatches are recorded into one command buffer
 *    with cached bind groups, instead of ~240 framebuffer binds, program
 *    switches and ~2,600 uniform calls on the page's main thread;
 *  - pipelines compile asynchronously before the first frame, so mounting the
 *    card never blocks on shader compilation;
 *  - no iframe: no second document, layout pass or font load per card.
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
  }
}

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
const MAX_STEPS = 120 // speed=120
const FPS = 28 // governor target
const MINSPF = 8
const WARM = 1.8 // sim units burned through in batches on ignition
const FLOW = 0.45 // flame flicker on the wall clock
const FROST = 0.85
/** Steps per frame while warming. The page used 900 on screen and 150 off; both now 150 off, 300 on. */
const WARM_STEPS_PRELOAD = 150
const WARM_STEPS_ACTIVE = 300
/** Rows in the per-stage parameter buffer: two RK stages per step, at the largest batch. */
const MAX_STAGES = 2 * Math.max(MAX_STEPS, WARM_STEPS_ACTIVE)

const KEROLOX = { soot: 1.0, band: [0.3, 0.4, 1.0] as [number, number, number], bandK: 0.0, expo: 45.0 }

const TILE: [number, number] = [16, 8]

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
    // The pointer probe changes once per frame and is read by all four step
    // kernels, so it is shared too; each dispatch captures its current value.
    const probeU = uniforms(gpu, { pos: [0, 0], vel: [0, 0], radius: PROBE_R, strength: 0 })

    // Three state buffers cycle through the RK2 stages:
    //   stage 1: tmp = s + dt L(s);   stage 2: out = (s + tmp + dt L(tmp)) / 2
    // and the result becomes the next step's state, so two bindings alternate.
    const bytes = NX * NR * 16
    const A = storage(gpu, bytes)
    const B = storage(gpu, bytes)
    const C = storage(gpu, bytes)
    const fields = texture(gpu, {
      kind: "2d",
      size: [NX, NR],
      format: "rgba16float",
      usage: ["storage_binding", "texture_binding"],
    })

    // Per-stage values (pressure, time, turbulence), one vec4 row per RK stage,
    // uploaded once per frame; the kernels index it with a GPU step counter
    // that alternates between two buffers (see step.wgsl).
    const params = storage(gpu, MAX_STAGES * 16, "read")
    const counterA = storage(gpu, 4)
    const counterB = storage(gpu, 4)
    const rows = new Float32Array(MAX_STAGES * 4)
    const zero = new Uint32Array(1)

    const mkStep = (src: StorageBuffer, base: StorageBuffer, dst: StorageBuffer, second: boolean) =>
      compute(gpu, stepShader, {
        label: "nozzle.step",
        set: {
          grid,
          probe: probeU,
          src,
          base,
          dst,
          params,
          stage: second ? { a: 0.5, b: 0.5 } : { a: 0, b: 1 },
          counterIn: second ? counterB : counterA,
          counterOut: second ? counterA : counterB,
        },
      })
    // parity 0: state in A, result in C; parity 1: state in C, result in A
    const steps: [Compute, Compute][] = [
      [mkStep(A, A, B, false), mkStep(B, A, C, true)],
      [mkStep(C, C, B, false), mkStep(B, C, A, true)],
    ]
    const derives = [A, C].map((src) => compute(gpu, deriveShader, { label: "nozzle.derive", set: { grid, src, fields } }))
    const reset = compute(gpu, initShader, { label: "nozzle.init", set: { grid, dst: A } })

    const linear = sampler(gpu, { minFilter: "linear", magFilter: "linear" })
    const view = surface(gpu, canvas, { dpr: 1, alphaMode: "opaque" })
    const half = () => [Math.max(2, view.size[0] >> 1), Math.max(2, view.size[1] >> 1)] as const
    const eighth = () => [Math.max(2, view.size[0] >> 3), Math.max(2, view.size[1] >> 3)] as const
    const twentieth = () => [Math.max(2, Math.round(view.size[0] / 20)), Math.max(2, Math.round(view.size[1] / 20))] as const
    const hdr = { format: "rgba16float" as GPUTextureFormat }
    const VT = target(gpu, { size: half(), ...hdr })
    const VB1a = target(gpu, { size: eighth(), ...hdr })
    const VB1b = target(gpu, { size: eighth(), ...hdr })
    const VB2a = target(gpu, { size: twentieth(), ...hdr })
    const VB2b = target(gpu, { size: twentieth(), ...hdr })

    const visual: Effect = effect(gpu, visualShader, { label: "nozzle.visual", set: { fields, fieldSampler: linear } })
    const blur: Effect = effect(gpu, blurShader, { label: "nozzle.blur", set: { srcSampler: linear } })
    const display: Effect = effect(gpu, displayShader, {
      label: "nozzle.display",
      set: { glow: VT, bloomA: VB1b, bloomB: VB2b, linearSampler: linear },
    })

    // Compile every pipeline off the main thread before the first frame.
    await Promise.all([
      ...steps.flat().map((s) => s.compile()),
      ...derives.map((d) => d.compile()),
      reset.compile(),
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
          ext: [NX * H, NR * H],
          xv: XV,
          height: VT.size[1],
          band: KEROLOX.band,
          soot: KEROLOX.soot,
          bandK: KEROLOX.bandK,
          tK: 875,
          time: 0,
          turb: TURB,
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

    /** Encodes `n` solver steps and a field update into one compute pass. */
    function solve(n: number) {
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
      // the GPU half: 2n dispatches with fixed bindings, nothing set between them
      frame(gpu, (f) =>
        f.computePass({ label: "nozzle.solve" }, (pass) => {
          for (let i = 0; i < n; i++) {
            const [s1, s2] = steps[par]
            pass.dispatch(s1, groups[0], groups[1])
            pass.dispatch(s2, groups[0], groups[1])
            par ^= 1
          }
          pass.dispatch(derives[par], groups[0], groups[1])
        })
      )
      parity = par
    }

    function draw(out: Target = view) {
      frame(gpu, (f) => {
        visual.set({ vis: { time: (performance.now() / 1000) * FLOW } })
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
      })
    }

    // ambient air at rest, then light the engine at once: the warm start skips
    // the startup transient so the plume is fully out on the first visible frame
    reset.dispatch(groups[0], groups[1])
    ignited = true
    tIgn = t

    /* ------------------------------------------------------------ pointer */

    // Client px -> sim (x, r), inverting the display transform in layout().
    let pointerAt: { x: number; y: number } | null = null
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
      const at = pointerAt ? toSim(pointerAt) : null
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
    let spf = Math.max(12, MINSPF)
    let last = performance.now()
    let acc = 0
    let frames = 0
    let lastAdapt = last

    function loop(now: number) {
      if (disposed) return
      if (!active) {
        // off screen: finish the warm-up gently without drawing, then stop
        // scheduling frames entirely until the card comes into view
        if (warming()) {
          solve(WARM_STEPS_PRELOAD)
          raf = requestAnimationFrame(loop)
        } else raf = 0
        last = now
        return
      }
      // clamp so a long pause doesn't read as one huge slow frame and starve spf
      const fdt = Math.min(Math.max((now - last) / 1000, 0), 0.1)
      last = now
      const n = warming() ? WARM_STEPS_ACTIVE : spf
      updateProbe(fdt, n * DT)
      solve(n)
      draw()
      // adapt steps/frame to hold the frame rate
      acc += fdt
      frames++
      if (now - lastAdapt > 350) {
        const avg = acc / frames
        acc = 0
        frames = 0
        lastAdapt = now
        if (avg > 1 / (FPS * 0.82)) spf = Math.max(MINSPF, Math.floor(spf * 0.8))
        else if (avg < 1 / FPS) spf = Math.min(MAX_STEPS, Math.ceil(spf * 1.3) + 1)
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
      if (!document.hidden) last = performance.now()
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
      },
      dispose() {
        if (disposed) return
        disposed = true
        cancelAnimationFrame(raf)
        offResize()
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
