"use client"

import { useEffect, useRef, useState } from "react"
import { renderTile } from "@/lib/satellite/shared-renderer"
import { observeVisibility } from "@/lib/canvas"
import type { PanelVariant, LightingVariant } from "@/lib/satellite/panel-variants"

/**
 * Spacecraft render, parameterised by panel and lighting variant.
 *
 * Draws through one shared WebGL context (see `shared-renderer`) and blits the
 * result into this tile's own 2D canvas. That is what lets the comparison lab
 * show ~34 tiles at once: browsers cap live WebGL contexts at roughly 16, so a
 * context per tile silently exhausts the pool and most tiles come back blank.
 *
 * Static by default — one frame on mount, one per resize. `interactive` opts
 * into an animation loop for the downlink duty cycle and pointer parallax, and
 * is used only by the hero.
 */
export function SatelliteRender({
  panel,
  lighting,
  className = "",
  /** Closer framing for material study; the hero wants the full span. */
  closeUp = false,
  lasers = true,
  /** Animate the beams and follow the pointer. */
  interactive = false,
}: {
  panel: PanelVariant
  lighting: LightingVariant
  className?: string
  closeUp?: boolean
  lasers?: boolean
  interactive?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const animate = interactive && !reduced

    let disposed = false
    let raf = 0
    let visible = false
    let start = 0

    // Target follows the pointer; current eases toward it so the craft drifts
    // rather than snapping. Kept in refs so the loop never re-renders React.
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }

    const sizeOf = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      return {
        w,
        h,
        pw: Math.max(1, Math.floor(w * dpr)),
        ph: Math.max(1, Math.floor(h * dpr)),
      }
    }

    const paint = (time?: number) => {
      if (disposed) return
      const { w, h, pw, ph } = sizeOf()
      if (w === 0 || h === 0) return

      const source = renderTile({
        panel,
        lighting,
        lasers,
        closeUp,
        width: pw,
        height: ph,
        time,
        pointer: animate ? current : undefined,
      })

      if (!source) {
        setFailed(true)
        return
      }

      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw
        canvas.height = ph
      }
      ctx.clearRect(0, 0, pw, ph)
      // Must copy immediately: the shared drawing buffer is not preserved and
      // the next tile's render will overwrite it.
      ctx.drawImage(source, 0, 0, pw, ph)
    }

    const loop = (now: number) => {
      if (disposed || !visible) return
      raf = requestAnimationFrame(loop)
      if (!start) start = now

      // Critically damped-ish easing: fast enough to feel responsive, slow
      // enough that the craft never twitches.
      current.x += (target.x - current.x) * 0.06
      current.y += (target.y - current.y) * 0.06

      paint((now - start) / 1000)
    }

    paint(animate ? 0 : undefined)

    if (animate) {
      const onPointer = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return
        // Normalise to -1..1 across the canvas, clamped so pointers far
        // outside it do not push the parallax past its intended range.
        target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
        target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
      }
      // Listen on the window: the canvas is pointer-events:none so it never
      // steals clicks from the copy layered over it.
      window.addEventListener("pointermove", onPointer, { passive: true })

      const unobserve = observeVisibility(canvas, (v) => {
        visible = v && document.visibilityState === "visible"
        cancelAnimationFrame(raf)
        if (visible) raf = requestAnimationFrame(loop)
      })

      const onVis = () => {
        visible = document.visibilityState === "visible" && visible
        cancelAnimationFrame(raf)
        if (visible) raf = requestAnimationFrame(loop)
      }
      document.addEventListener("visibilitychange", onVis)

      const ro = new ResizeObserver(() => paint(0))
      ro.observe(canvas)

      return () => {
        disposed = true
        cancelAnimationFrame(raf)
        unobserve()
        ro.disconnect()
        window.removeEventListener("pointermove", onPointer)
        document.removeEventListener("visibilitychange", onVis)
      }
    }

    const ro = new ResizeObserver(() => paint())
    ro.observe(canvas)
    return () => {
      disposed = true
      ro.disconnect()
    }
  }, [panel, lighting, closeUp, lasers, interactive])

  if (failed) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
