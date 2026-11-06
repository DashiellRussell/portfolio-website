"use client"

import { useEffect, useRef, useState } from "react"
import type { NozzleController } from "./nozzle/nozzle-gpu"

/**
 * Nozzle startup: a GPU axisymmetric Euler solver (HLLC + MUSCL, SSP-RK2)
 * with a line-of-sight glow render.
 *
 * Two implementations of the same simulation:
 *   - WebGPU (default): `nozzle/nozzle-gpu.ts`, compute kernels driven by
 *     vgpu and drawn straight into this component's canvas;
 *   - WebGL 2 (fallback): the standalone page `public/sims/nozzle.html`,
 *     embedded as an iframe with its controls hidden. Used when WebGPU is
 *     unavailable or fails to start, or when the URL has `?nozzle=webgl`.
 *
 * Both step the solver every frame while shown, so callers must only mount
 * this while it is near the screen (see `OnScreen`) — unmounting frees the
 * GPU device or WebGL context entirely.
 *
 * Options for the WebGL page (the WebGPU port bakes in the same set):
 * Options (all handled by the page itself):
 *   embed       hide the UI, loop ignition
 *   top/bottom  both halves on the visual glow, so it reads as a plume
 *   horizontal  always fire sideways
 *   clean       no axis dashes or frame line; edges fade into the page
 *   lite        half the glow samples, 1x pixel ratio
 *   speed=120   the "Fast" setting: up to 120 solver steps per frame
 *   loop=0      burn continuously instead of re-igniting every couple of seconds
 *   warm=1.8    skip ahead through the startup so the plume is fully out immediately
 *   fps=28      let the governor run more steps even when the page sits at 30 fps
 *   minspf=8    never fall below 8 steps per frame
 *   flow=0.45   flame flicker on the wall clock, so it reads as real time
 *   flushleft   engine pinned to the left edge at any aspect ratio
 *   frost=0.85  cryogenic rime on the engine's injector end
 * Open the page directly for the full controls.
 */
export const NOZZLE_BG = "03050a" // --surface-sunken
const COMMON = `embed&legend=0&top=visual&bottom=visual&res=low&speed=120&clean&lite&loop=0&warm=1.8&fps=28&minspf=8&flow=0.45&frost=0.85&bg=${NOZZLE_BG}`
// wide panels: fire sideways from the left edge. Phones: the sim's own portrait
// layout, engine at the top firing straight down.
const SRC = `/sims/nozzle.html?${COMMON}&horizontal&flushleft`
const SRC_VERTICAL = `/sims/nozzle.html?${COMMON}`

/** `NOZZLE_BG` as 0..1 RGB for the WebGPU composite. */
const BG_RGB = [0, 2, 4].map((i) => parseInt(NOZZLE_BG.slice(i, i + 2), 16) / 255) as [number, number, number]

type Mode = "gpu" | "webgl"

/** WebGPU unless the browser lacks it; remembered so later mounts skip the attempt. */
let preferred: Mode | null = null
function initialMode(): Mode {
  if (preferred) return preferred
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return "webgl"
  if (new URLSearchParams(window.location.search).get("nozzle") === "webgl") return "webgl"
  return "gpu"
}

/**
 * `active` false: the card is being prepared off screen. The sim warms up
 * without drawing and then idles, and starts drawing when the card arrives,
 * so the plume is already fully out on the first frame.
 */
export function NozzleSim({ style, active = true, vertical = false }: { style?: React.CSSProperties; active?: boolean; vertical?: boolean }) {
  // decided after mount: the server render cannot know whether WebGPU exists
  const [mode, setMode] = useState<Mode | null>(null)
  useEffect(() => setMode(initialMode()), [])

  if (mode === "gpu")
    return (
      <NozzleGpu
        style={style}
        active={active}
        vertical={vertical}
        onFail={(err) => {
          console.warn("[nozzle] WebGPU unavailable, falling back to WebGL", err)
          preferred = "webgl"
          setMode("webgl")
        }}
      />
    )
  if (mode === "webgl") return <NozzleFrame style={style} active={active} vertical={vertical} />
  return <div aria-hidden="true" style={{ background: `#${NOZZLE_BG}`, ...style }} />
}

function NozzleGpu({
  style,
  active,
  vertical,
  onFail,
}: {
  style?: React.CSSProperties
  active: boolean
  vertical: boolean
  onFail: (err: unknown) => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const ctl = useRef<NozzleController | null>(null)
  const latest = useRef(active)
  const fail = useRef(onFail)
  fail.current = onFail

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let cancelled = false
    // loaded with the card, so pages without it never download vgpu
    import("./nozzle/nozzle-gpu")
      .then(({ startNozzle }) => startNozzle(el, { horizontal: !vertical, bg: BG_RGB }))
      .then((c) => {
        if (cancelled) return c.dispose()
        ctl.current = c
        c.setActive(latest.current)
      })
      .catch((err) => {
        if (!cancelled) fail.current(err)
      })
    return () => {
      cancelled = true
      ctl.current?.dispose()
      ctl.current = null
    }
  }, [vertical])

  useEffect(() => {
    latest.current = active
    ctl.current?.setActive(active)
  }, [active])

  // The pointer is a probe in the flow. The canvas sits under the card's copy
  // and never sees events itself, so follow the pointer on the window; the sim
  // ignores positions outside its window. A touch holds the probe while the
  // finger is down.
  useEffect(() => {
    if (!active) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return
    const at = (x: number, y: number) => ctl.current?.pointer({ x, y })
    const off = () => ctl.current?.pointer(null)
    const onMove = (e: PointerEvent) => e.pointerType !== "touch" && at(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) at(t.clientX, t.clientY)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("touchstart", onTouch, { passive: true })
    window.addEventListener("touchmove", onTouch, { passive: true })
    window.addEventListener("touchend", off, { passive: true })
    window.addEventListener("touchcancel", off, { passive: true })
    document.addEventListener("pointerleave", off)
    // a page scroll moves the sim under a still cursor; no event says so, but
    // the probe re-reads the canvas rect every frame, so only leaving matters
    return () => {
      off()
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("touchstart", onTouch)
      window.removeEventListener("touchmove", onTouch)
      window.removeEventListener("touchend", off)
      window.removeEventListener("touchcancel", off)
      document.removeEventListener("pointerleave", off)
    }
  }, [active])

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      style={{ display: "block", pointerEvents: "none", background: `#${NOZZLE_BG}`, ...style }}
    />
  )
}

/** The WebGL 2 page in an iframe, driven over postMessage. */
function NozzleFrame({ style, active, vertical }: { style?: React.CSSProperties; active: boolean; vertical: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  // fixed at mount: changing src would reload the solver
  const base = vertical ? SRC_VERTICAL : SRC
  const [src] = useState(() => (active ? base : `${base}&preload`))
  const latest = useRef(active)
  const post = () => frame.current?.contentWindow?.postMessage(latest.current ? "play" : "preload", window.location.origin)
  useEffect(() => {
    latest.current = active
    post()
  }, [active])
  return (
    <iframe
      ref={frame}
      src={src}
      title="Rocket nozzle startup simulation"
      aria-hidden="true"
      tabIndex={-1}
      onLoad={post}
      style={{ border: 0, pointerEvents: "none", background: `#${NOZZLE_BG}`, ...style }}
    />
  )
}

export default NozzleSim
