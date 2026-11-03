"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Nozzle startup: a GPU axisymmetric Euler solver (HLLC + MUSCL, SSP-RK2)
 * with a line-of-sight glow render, served as a standalone page from
 * `public/sims/nozzle.html` and embedded here with its controls hidden.
 *
 * The solver steps every frame while its page is visible, so callers must
 * only mount this while it is on screen (see `OnScreen`) — unmounting the
 * iframe frees its WebGL context entirely.
 *
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
const SRC = `/sims/nozzle.html?embed&legend=0&top=visual&bottom=visual&res=low&speed=120&horizontal&clean&lite&loop=0&warm=1.8&fps=28&minspf=8&flow=0.45&flushleft&frost=0.85&bg=${NOZZLE_BG}`

/**
 * `active` false: the card is being prepared off screen. The page starts in
 * `preload` (warm-up without drawing, then idle) and is told to `play` when
 * the card arrives, so the plume is already fully out on the first frame.
 */
export function NozzleSim({ style, active = true }: { style?: React.CSSProperties; active?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  // fixed at mount: changing src would reload the solver
  const [src] = useState(() => (active ? SRC : `${SRC}&preload`))
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
