"use client"

import { useEffect } from "react"
import { useThree } from "@react-three/fiber"

/**
 * Compiles every material in the scene and uploads its geometry as soon as
 * it mounts, then draws one frame. Place it inside the same Suspense
 * boundary as the models: it runs once they have loaded, while the card is
 * still being prepared off screen, so the first visible frame doesn't stall
 * on shader compilation.
 */
export function Prewarm() {
  const { gl, scene, camera, invalidate } = useThree()
  useEffect(() => {
    gl.compile(scene, camera)
    invalidate()
  }, [gl, scene, camera, invalidate])
  return null
}
