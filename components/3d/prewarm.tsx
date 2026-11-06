"use client"

import { useEffect } from "react"
import { useThree } from "@react-three/fiber"

/**
 * Compiles every material in the scene and uploads its geometry as soon as
 * it mounts, then draws one frame. Place it inside the same Suspense
 * boundary as the models: it runs once they have loaded, while the card is
 * still being prepared off screen, so the first visible frame doesn't stall
 * on shader compilation.
 *
 * `compileAsync` lets the driver compile in parallel (KHR_parallel_shader_compile)
 * and polls for completion instead of blocking the main thread on each
 * program's link status, which is what made cards hitch as they mounted.
 */
export function Prewarm() {
  const { gl, scene, camera, invalidate } = useThree()
  useEffect(() => {
    let live = true
    gl.compileAsync(scene, camera)
      .catch(() => gl.compile(scene, camera))
      .then(() => live && invalidate())
    return () => {
      live = false
    }
  }, [gl, scene, camera, invalidate])
  return null
}

/**
 * Production canvases skip three's per-program error check: reading a
 * program's link status forces the compile to finish synchronously, which
 * stalls the page every time a card mounts. Development keeps the check.
 */
export function fastShaders(gl: { debug: { checkShaderErrors: boolean } }) {
  if (process.env.NODE_ENV === "production") gl.debug.checkShaderErrors = false
}
