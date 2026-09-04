"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { Zone } from "@/lib/content/types"

/**
 * Drives the site's one moving part: the accent colour and backdrop mood shift
 * as the reader scrolls between zones. Typography, spacing and component
 * language deliberately do not change — that is what keeps four environments
 * reading as one site.
 *
 * Zones register themselves via `useZoneAnchor`, so adding a section does not
 * require touching this file.
 */

const ZONE_VAR: Record<Zone, string> = {
  ascent: "--zone-ascent",
  orbit: "--zone-orbit",
  deep: "--zone-deep",
  ground: "--zone-ground",
}

interface ZoneContextValue {
  zone: Zone
  register: (el: HTMLElement, zone: Zone) => () => void
}

const ZoneContext = createContext<ZoneContextValue | null>(null)

export function ZoneProvider({
  children,
  initial = "orbit",
}: {
  children: React.ReactNode
  initial?: Zone
}) {
  const [zone, setZone] = useState<Zone>(initial)
  const entries = useRef(new Map<HTMLElement, Zone>())

  const register = useMemo(
    () => (el: HTMLElement, z: Zone) => {
      entries.current.set(el, z)
      return () => {
        entries.current.delete(el)
      }
    },
    []
  )

  useEffect(() => {
    let raf = 0
    let pending = false

    const evaluate = () => {
      pending = false
      // The zone that owns the vertical centre of the viewport wins. This is
      // more stable than IntersectionObserver ratios when sections differ
      // wildly in height, which they do here.
      const mid = window.innerHeight / 2
      let best: Zone | null = null
      let bestDist = Infinity

      for (const [el, z] of entries.current) {
        const r = el.getBoundingClientRect()
        if (r.bottom < 0 || r.top > window.innerHeight) continue
        // Distance from viewport centre to the section's nearest edge.
        const dist = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid))
        if (dist < bestDist) {
          bestDist = dist
          best = z
        }
      }

      if (best) setZone((prev) => (prev === best ? prev : best))
    }

    const onScroll = () => {
      if (pending) return
      pending = true
      raf = requestAnimationFrame(evaluate)
    }

    evaluate()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const value = getComputedStyle(root).getPropertyValue(ZONE_VAR[zone]).trim()
    if (value) root.style.setProperty("--accent", value)
    root.dataset.zone = zone
  }, [zone])

  return (
    <ZoneContext.Provider value={{ zone, register }}>{children}</ZoneContext.Provider>
  )
}

export function useZone(): Zone {
  return useContext(ZoneContext)?.zone ?? "orbit"
}

/** Attach to a section element to claim a zone while it holds the viewport. */
export function useZoneAnchor(zone: Zone) {
  const ctx = useContext(ZoneContext)
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!ctx || !ref.current) return
    return ctx.register(ref.current, zone)
  }, [ctx, zone])

  return ref
}
