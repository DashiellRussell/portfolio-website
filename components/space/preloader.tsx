"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

/**
 * Initial load sequence: a three-count inside an orbit ring that draws
 * itself while the systems come up line by line, then the name assembles,
 * then ignition — a bright line across the middle and the screen parting
 * along it to reveal the site.
 *
 * Driven by one rAF clock rather than chained timeouts: the first load is
 * busy (hydration, the hero canvases starting up) and timers fire late
 * there, which froze the count. Reading elapsed time each frame means a
 * stall only drops frames; the sequence still plays in full and in order.
 *
 * Mounts once in the root layout, so client navigation never replays it.
 * Under reduced motion it resolves immediately.
 */

const SYSTEMS = [
  "CAD models ........ loaded",
  "Nozzle solver ..... ready",
  "Shaders ........... compiled",
  "Stator winder ..... indexed",
  "Telemetry ......... nominal",
]

// timeline, ms
const T = { count: 2100, name: 2100 + 650, ignite: 2100 + 650 + 750 }
const END = T.ignite + 700
const NAME = "DASHIELL RUSSELL"

export function Preloader() {
  const [ms, setMs] = useState(0)
  const [done, setDone] = useState(false)
  const start = useRef<number | null>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true)
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    let raf = 0
    const tick = (now: number) => {
      if (start.current === null) start.current = now
      const e = now - start.current
      setMs(e)
      if (e >= T.ignite) document.body.style.overflow = prev
      if (e >= END) setDone(true)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = prev
    }
  }, [])

  const counting = ms < T.count
  const count = 3 - Math.min(2, Math.floor((ms / T.count) * 3))
  const ring = Math.min(1, ms / T.count)
  const systemsUp = Math.min(SYSTEMS.length, Math.floor((ms / T.count) * (SYSTEMS.length + 0.6)))
  const naming = ms >= T.count
  const igniting = ms >= T.ignite
  const ease = [0.7, 0, 0.2, 1] as const

  return (
    <AnimatePresence>
      {!done && (
        <motion.div key="preloader" className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true">
          {(["top", "bottom"] as const).map((side) => (
            <motion.div
              key={side}
              className="absolute inset-x-0"
              style={{ background: "var(--background)", [side]: 0, height: "50.5%" }}
              animate={igniting ? { y: side === "top" ? "-100%" : "100%" } : { y: 0 }}
              transition={{ duration: 0.62, ease, delay: 0.08 }}
            />
          ))}

          <motion.div
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
            style={{ background: "var(--zone-ascent)", boxShadow: "0 0 24px 4px color-mix(in oklab, var(--zone-ascent) 70%, transparent)" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={igniting ? { scaleX: 1, opacity: [0, 1, 1, 0] } : { scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.7, ease, times: [0, 0.15, 0.6, 1] }}
          />

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center px-6"
            animate={{ opacity: igniting ? 0 : 1 }}
            transition={{ duration: 0.18 }}
          >
            <div className="relative flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
              <svg className="absolute inset-0" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="var(--border-strong)" strokeWidth="0.6" />
                <circle
                  cx="50" cy="50" r="46" fill="none"
                  stroke="var(--zone-ascent)" strokeWidth="1.2" strokeLinecap="round"
                  pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring}
                  transform="rotate(-90 50 50)"
                />
                <g transform={`rotate(${ring * 360 - 90} 50 50)`}>
                  <circle cx="96" cy="50" r="2" fill="var(--foreground)" />
                </g>
              </svg>
              {/* re-keyed each count: the entrance replays, no exit to wait on */}
              {counting ? (
                  <motion.span
                    key={count}
                    className="font-mono tabular-nums"
                    style={{ fontSize: "var(--step-3)", color: "var(--foreground)" }}
                    initial={{ opacity: 0, scale: 1.35, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.18 }}
                  >
                    T−0{count}
                  </motion.span>
                ) : (
                  <motion.span key="lift" className="label" style={{ color: "var(--zone-ascent)" }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    Liftoff
                  </motion.span>
                )}
            </div>

            {/* systems coming up, then the name in the same slot */}
            <div className="relative mt-8 h-[8.5rem] w-full max-w-sm">
              <motion.ul
                className="absolute inset-0 space-y-1.5"
                animate={{ opacity: naming ? 0 : 1, y: naming ? -8 : 0 }}
                transition={{ duration: 0.25 }}
              >
                {SYSTEMS.map((line, i) => (
                  <li
                    key={line}
                    className="font-mono transition-opacity duration-200"
                    style={{
                      fontSize: "var(--step--1)",
                      letterSpacing: "0.06em",
                      opacity: i < systemsUp ? 1 : 0.14,
                      color: i < systemsUp ? "var(--foreground)" : "var(--subtle)",
                    }}
                  >
                    {line}
                  </li>
                ))}
              </motion.ul>

              <div className="absolute inset-x-0 top-6 flex justify-center overflow-hidden" style={{ fontSize: "var(--step-1)" }}>
                {NAME.split("").map((ch, i) => (
                  <motion.span
                    key={i}
                    className="inline-block font-semibold tracking-[0.18em]"
                    style={{ color: "var(--foreground)", width: ch === " " ? "0.6em" : undefined }}
                    initial={{ y: "120%" }}
                    animate={naming ? { y: 0 } : { y: "120%" }}
                    transition={{ duration: 0.4, ease, delay: i * 0.024 }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
