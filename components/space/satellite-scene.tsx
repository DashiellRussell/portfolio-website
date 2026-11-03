"use client"

import dynamic from "next/dynamic"
import { AsciiField } from "./ascii-field"

/**
 * The spacecraft hero, with its own fallback baked in.
 *
 * `Satellite3D` pulls in three plus RoomEnvironment, so it is loaded lazily and
 * only on the client. The ASCII field sits underneath it always: if WebGL is
 * unavailable the 3D layer renders nothing and the field simply shows through,
 * so the panel is never empty.
 */
const Satellite3D = dynamic(
  () => import("./satellite-3d").then((m) => m.Satellite3D),
  { ssr: false }
)

export function SatelliteScene() {
  return (
    <div className="absolute inset-0">
      <AsciiField className="opacity-25" />
      <Satellite3D />
    </div>
  )
}
