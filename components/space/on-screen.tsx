"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { observeVisibility } from "@/lib/canvas"

/**
 * Two-stage mounting for the heavy card visuals.
 *
 *   near    within a screen of the viewport: mount, but only once the
 *           browser is idle, so the work (model decode, shader compile, the
 *           solver's warm-up) lands while the reader is still on the previous
 *           card instead of in the frames they scroll through;
 *   active  actually on screen: children should animate. While mounted but
 *           not active they render at most a frame and then sit idle.
 *
 * Anything further than a screen away is unmounted, dropping its WebGL
 * context and GPU memory entirely.
 */
const Active = createContext(true)

/** True while the enclosing `OnScreen` is in the viewport. */
export const useOnScreenActive = () => useContext(Active)

export function OnScreen({ children, className }: { children: React.ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const offNear = observeVisibility(el, setNear, "100% 0px")
    const offActive = observeVisibility(el, setActive, "0px")
    return () => { offNear(); offActive() }
  }, [])

  useEffect(() => {
    if (!near) {
      setMounted(false)
      return
    }
    // mount in idle time; if the card is already on screen, don't wait
    if (active) {
      setMounted(true)
      return
    }
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (ric) {
      const id = ric(() => setMounted(true), { timeout: 1200 })
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id)
    }
    const t = setTimeout(() => setMounted(true), 200)
    return () => clearTimeout(t)
  }, [near, active])

  return (
    <div ref={box} className={className} style={{ position: "absolute", inset: 0 }}>
      <Active.Provider value={active}>{mounted ? children : null}</Active.Provider>
    </div>
  )
}
