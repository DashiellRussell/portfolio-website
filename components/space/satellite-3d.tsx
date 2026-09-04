"use client"

import { SatelliteRender } from "./satellite-render"
import { PANEL_VARIANTS, LIGHTING_VARIANTS } from "@/lib/satellite/panel-variants"

/**
 * The spacecraft as it appears on the site.
 *
 * Geometry, materials and lighting all live in `lib/satellite`, shared with
 * the comparison lab at /lab/panels — so what is chosen there is exactly what
 * ships here. To change the look, swap the ids below.
 */

const PANEL = PANEL_VARIANTS.find((v) => v.id === "brushed") ?? PANEL_VARIANTS[0]
const LIGHTING = LIGHTING_VARIANTS.find((l) => l.id === "terminator") ?? LIGHTING_VARIANTS[0]

export function Satellite3D({ className = "" }: { className?: string }) {
  return (
    <SatelliteRender
      panel={PANEL}
      lighting={LIGHTING}
      className={className}
      interactive
    />
  )
}
