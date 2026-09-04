import * as THREE from "three"
import {
  buildSatellite,
  makeSpaceEnvironment,
  addLights,
  disposeScene,
  animateBeams,
} from "./build"
import type { PanelVariant, LightingVariant } from "./panel-variants"

/**
 * One WebGL context for the whole page.
 *
 * Browsers cap live WebGL contexts at roughly 16, and the comparison lab wants
 * ~34 tiles. Giving each tile its own renderer silently exhausts the pool and
 * most tiles render nothing at all. Because every scene here is a single
 * static frame, one shared renderer can draw each tile in turn and the result
 * is blitted into that tile's own 2D canvas.
 *
 * Scenes and PMREM environments are cached by variant, so N tiles sharing a
 * lighting setup pay for one environment, not N.
 */

let renderer: THREE.WebGLRenderer | null = null
let pmrem: THREE.PMREMGenerator | null = null
let unavailable = false

interface CachedScene {
  scene: THREE.Scene
  envScene: THREE.Scene
  envRT: THREE.WebGLRenderTarget
  camera: THREE.PerspectiveCamera
  sat: THREE.Group
  beams: THREE.Group[]
}

const scenes = new Map<string, CachedScene>()

function getRenderer(): THREE.WebGLRenderer | null {
  if (unavailable) return null
  if (renderer) return renderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch {
    unavailable = true
    return null
  }
  if (!renderer.getContext()) {
    unavailable = true
    renderer = null
    return null
  }
  renderer.setPixelRatio(1) // DPR is applied per-tile via the requested size.
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  pmrem = new THREE.PMREMGenerator(renderer)
  return renderer
}

function getScene(
  panel: PanelVariant,
  lighting: LightingVariant,
  lasers: boolean,
  fov: number
): CachedScene | null {
  const key = `${panel.id}|${lighting.id}|${lasers}|${fov}`
  const hit = scenes.get(key)
  if (hit) return hit

  const r = getRenderer()
  if (!r || !pmrem) return null

  const scene = new THREE.Scene()
  const envScene = makeSpaceEnvironment(lighting)
  const envRT = pmrem.fromScene(envScene, 0.02)
  scene.environment = envRT.texture

  addLights(scene, lighting)

  const { group: sat, beams } = buildSatellite({ panel, lasers })
  sat.rotation.set(0, -0.3, 0.07)
  scene.add(sat)

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 600)

  const entry = { scene, envScene, envRT, camera, sat, beams }
  scenes.set(key, entry)
  return entry
}

export interface TileRequest {
  panel: PanelVariant
  lighting: LightingVariant
  lasers: boolean
  closeUp: boolean
  /** Device pixels. */
  width: number
  height: number
  /**
   * Seconds since mount. Omit for a static frame — the beams then render at
   * full strength and the craft sits at its base attitude.
   */
  time?: number
  /** Pointer parallax, each axis in -1..1. Omit for no parallax. */
  pointer?: { x: number; y: number }
}

/**
 * Draws one tile and returns the shared canvas to copy from. The caller must
 * blit synchronously — the drawing buffer is not preserved between renders.
 */
export function renderTile(req: TileRequest): HTMLCanvasElement | null {
  const r = getRenderer()
  if (!r) return null

  const fov = req.closeUp ? 30 : 34
  const entry = getScene(req.panel, req.lighting, req.lasers, fov)
  if (!entry) return null

  const { scene, camera, sat, beams } = entry

  // The scene is shared between tiles, so animated state is written on every
  // pass — never left over from whichever tile drew last.
  const px = req.pointer?.x ?? 0
  const py = req.pointer?.y ?? 0
  sat.rotation.set(0.07 * py + 0.02, -0.3 + 0.22 * px, 0.07 - 0.03 * px)

  animateBeams(beams, req.time)

  r.toneMappingExposure = req.lighting.exposure
  r.setSize(req.width, req.height, false)

  const aspect = req.width / req.height
  camera.aspect = aspect
  camera.updateProjectionMatrix()

  // Close-up looks along the array so the finish fills the frame; the wide
  // shot frames the whole craft.
  const target = req.closeUp
    ? new THREE.Vector3(5.2, 0, 0)
    : new THREE.Vector3(0, 0, 0)
  const dir = req.closeUp
    ? new THREE.Vector3(0.55, 0.72, 0.95).normalize()
    : new THREE.Vector3(6.5, 8.5, 17).normalize()
  const base = req.closeUp ? 7.5 : 21
  const dist = aspect < 1 ? base * 1.5 : base

  camera.position.copy(target).addScaledVector(dir, dist)
  camera.position.x += px * dist * 0.055
  camera.position.y += py * dist * 0.04
  camera.lookAt(target)

  r.render(scene, camera)
  return r.domElement
}

/** Frees every cached scene and the shared context. */
export function disposeShared() {
  for (const { scene, envScene, envRT } of scenes.values()) {
    disposeScene(scene, envScene)
    envRT.texture.dispose()
  }
  scenes.clear()
  pmrem?.dispose()
  pmrem = null
  renderer?.dispose()
  renderer = null
}
