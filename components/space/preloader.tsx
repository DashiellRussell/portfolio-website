"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

/**
 * Initial load sequence — a pre-launch checklist that resolves into the site.
 *
 * Runs on every full page load (not on client-side navigation, since the
 * component only mounts once inside the root layout). Under reduced-motion it
 * resolves immediately rather than holding the reader on a splash.
 */

const LINES = [
  "POWER BUS ......... NOMINAL",
  "IMU CALIBRATION ... COMPLETE",
  "TELEMETRY LINK .... ACQUIRED",
  "FLIGHT SOFTWARE ... ARMED",
  "RANGE SAFETY ...... GO",
]

const LINE_MS = 190
const HOLD_MS = 260

export function Preloader() {
  const [done, setDone] = useState(false)
  const [shown, setShown] = useState(0)
  const [pct, setPct] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) {
      setDone(true)
      return
    }

    // Lock scroll while the sequence runs so the reader lands at the top.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    LINES.forEach((_, i) => {
      timers.current.push(setTimeout(() => setShown(i + 1), i * LINE_MS))
    })

    const total = LINES.length * LINE_MS
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total)
      setPct(Math.floor(p * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    timers.current.push(setTimeout(() => setDone(true), total + HOLD_MS))

    return () => {
      cancelAnimationFrame(raf)
      timers.current.forEach(clearTimeout)
      timers.current = []
      document.body.style.overflow = prevOverflow
    }
  }, [])

  // Restore scrolling as soon as the overlay starts leaving.
  useEffect(() => {
    if (done) document.body.style.overflow = ""
  }, [done])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "var(--background)" }}
          initial={{ opacity: 1 }}
          // The zone provider mounts after this and rewrites --accent, so the
          // preloader pins its own colour instead of following the live one —
          // otherwise the text visibly sweeps cyan to orange mid-sequence.
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
          aria-hidden="true"
        >
          <div className="container-page">
            <div className="mx-auto max-w-md">
              <div className="mb-8 flex items-baseline justify-between">
                <span className="label" style={{ color: "var(--zone-ascent)" }}>
                  Pre-launch
                </span>
                <span
                  className="font-mono tabular-nums"
                  style={{ fontSize: "var(--step-2)", color: "var(--foreground)" }}
                >
                  {String(pct).padStart(3, "0")}
                </span>
              </div>

              <ul className="space-y-2">
                {LINES.map((line, i) => (
                  <li
                    key={line}
                    className="font-mono transition-opacity duration-200"
                    style={{
                      fontSize: "var(--step--1)",
                      letterSpacing: "0.08em",
                      opacity: i < shown ? 1 : 0.12,
                      color: i < shown ? "var(--foreground)" : "var(--subtle)",
                    }}
                  >
                    {line}
                  </li>
                ))}
              </ul>

              {/* Progress rule */}
              <div
                className="mt-8 h-px w-full overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                <motion.div
                  className="h-full"
                  style={{ background: "var(--zone-ascent)" }}
                  animate={{ width: `${pct}%` }}
                  transition={{ ease: "linear", duration: 0.08 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
