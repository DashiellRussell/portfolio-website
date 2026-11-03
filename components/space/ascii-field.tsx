"use client"

import { useEffect, useRef } from "react"
import { monoFamily, observeVisibility, makeAccentReader } from "@/lib/canvas"

/**
 * Animated ASCII backdrop.
 *
 * Canvas 2D rather than WebGPU on purpose: this is the site's primary
 * atmosphere, so it must render on every browser a recruiter might open.
 *
 * Performance notes — several of these can exist on one page, so the renderer
 * is written to stay cheap:
 *  - it does nothing at all while scrolled out of view,
 *  - cells are batched into runs of equal colour, so a row costs a handful of
 *    fillText calls rather than one per character,
 *  - the accent colour is re-resolved on a timer, never per frame.
 */

/** Dark-to-light glyph ramp. Order matters: index = luminance bucket. */
const RAMP = " .:-=+*#%@"

/** Strings that surface out of the noise. Kept generic and factual. */
const PHRASES = [
  "TELEMETRY NOMINAL",
  "APOGEE DETECT",
  "ORBIT INSERTION",
  "LINK ACQUIRED",
  "ATTITUDE LOCK",
  "PAYLOAD ARMED",
  "DOWNLINK OPEN",
]

const CELL_W = 9
const CELL_H = 15
/** ASCII reads better under-sampled; 16fps is deliberate, not a compromise. */
const FRAME_MS = 1000 / 16
/** Quantise alpha into this many buckets so runs can be batched. */
const ALPHA_STEPS = 6

interface Emergent {
  text: string
  col: number
  row: number
  born: number
  life: number
}

/** Cheap 2D value noise — no dependency, deterministic, fast enough per-cell. */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function noise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}

export function AsciiField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let cols = 0
    let rows = 0
    let raf = 0
    let last = 0
    let visible = false
    let disposed = false
    const emergent: Emergent[] = []
    const readAccent = makeAccentReader()

    function resize() {
      if (!canvas || !ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return

      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / CELL_W)
      rows = Math.ceil(h / CELL_H)
      // Inline the resolved family: canvas cannot read CSS variables.
      ctx.font = `${CELL_H - 3}px ${monoFamily()}`
      ctx.textBaseline = "top"
    }

    function spawn(now: number) {
      if (emergent.length >= 3) return
      if (Math.random() > 0.025) return
      const text = PHRASES[Math.floor(Math.random() * PHRASES.length)]
      emergent.push({
        text,
        col: Math.floor(Math.random() * Math.max(1, cols - text.length)),
        row: Math.floor(Math.random() * rows),
        born: now,
        life: 3200 + Math.random() * 2000,
      })
    }

    function draw(now: number) {
      if (!ctx || !canvas) return
      const t = now * 0.00012
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

      // ---- Base noise field, batched into runs of equal alpha ----
      let run = ""
      let runStart = 0
      let runBucket = -1

      const flush = (r: number) => {
        if (run.length === 0 || runBucket <= 0) {
          run = ""
          return
        }
        const alpha = 0.1 + (runBucket / ALPHA_STEPS) * 0.62
        ctx.fillStyle = `rgba(158, 172, 196, ${alpha.toFixed(3)})`
        ctx.fillText(run, runStart * CELL_W, r * CELL_H)
        run = ""
      }

      for (let r = 0; r < rows; r++) {
        runBucket = -1
        run = ""
        for (let c = 0; c < cols; c++) {
          const n =
            noise(c * 0.055 + t * 6, r * 0.09 - t * 3) * 0.65 +
            noise(c * 0.14 - t * 2, r * 0.2 + t * 4) * 0.35

          const level = Math.max(0, n * 1.55 - 0.3)
          const bucket = Math.min(ALPHA_STEPS, Math.floor(level * ALPHA_STEPS))
          const glyph =
            bucket <= 0 ? " " : RAMP[Math.min(RAMP.length - 1, Math.floor(level * RAMP.length))]

          if (bucket !== runBucket) {
            flush(r)
            runBucket = bucket
            runStart = c
          }
          run += glyph
        }
        flush(r)
      }

      // ---- Emergent phrases, in the live accent ----
      const accent = readAccent(now)
      for (let i = emergent.length - 1; i >= 0; i--) {
        const e = emergent[i]
        const age = now - e.born
        if (age > e.life) {
          emergent.splice(i, 1)
          continue
        }
        const p = age / e.life
        const a = p < 0.25 ? p / 0.25 : p > 0.7 ? (1 - p) / 0.3 : 1

        // Resolve the whole string first, then draw it in one call.
        let out = ""
        for (let j = 0; j < e.text.length; j++) {
          const ch = e.text[j]
          if (ch === " ") {
            out += " "
            continue
          }
          const settle = Math.min(1, Math.max(0, (p - j * 0.012) * 6))
          out +=
            settle > 0.85
              ? ch
              : RAMP[Math.floor(hash(j, Math.floor(now * 0.01)) * RAMP.length)]
        }

        ctx.fillStyle = accent
        ctx.globalAlpha = a * 0.95
        ctx.fillText(out, e.col * CELL_W, e.row * CELL_H)
        ctx.globalAlpha = 1
      }
    }

    function loop(now: number) {
      if (disposed || !visible) return
      raf = requestAnimationFrame(loop)
      if (now - last < FRAME_MS) return
      last = now
      spawn(now)
      draw(now)
    }

    function start() {
      if (disposed || reduced) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(loop)
    }

    resize()

    // Only animate while actually on screen. With several fields on a page this
    // is the difference between one running renderer and seven.
    const unobserve = observeVisibility(canvas, (v) => {
      visible = v && document.visibilityState === "visible"
      if (visible) start()
      else cancelAnimationFrame(raf)
      if (v && reduced) draw(0)
    })

    const onResize = () => {
      resize()
      if (reduced) draw(0)
    }
    window.addEventListener("resize", onResize)

    const onVisibility = () => {
      visible = document.visibilityState === "visible" && visible
      if (visible) start()
      else cancelAnimationFrame(raf)
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      unobserve()
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
