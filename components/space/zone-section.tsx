"use client"

import type { CSSProperties, ReactNode, RefObject } from "react"
import { useCallback } from "react"
import type { Zone } from "@/lib/content/types"
import { useZoneAnchor } from "./zone-provider"

/**
 * A section that claims a zone while it holds the viewport centre.
 *
 * Thin client boundary so the panels themselves can stay server components.
 * `sectionRef` lets a caller also observe the element (e.g. for scroll scrub)
 * without fighting the zone anchor for the ref slot.
 */
export function ZoneSection({
  zone,
  children,
  className = "",
  style,
  id,
  sectionRef,
}: {
  zone: Zone
  children: ReactNode
  className?: string
  style?: CSSProperties
  id?: string
  sectionRef?: RefObject<HTMLElement | null>
}) {
  const anchorRef = useZoneAnchor(zone)

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      anchorRef.current = node
      if (sectionRef) sectionRef.current = node
    },
    [anchorRef, sectionRef]
  )

  return (
    <section ref={setRefs} id={id} className={className} style={style} data-zone={zone}>
      {children}
    </section>
  )
}
