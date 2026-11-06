import * as THREE from "three"
import {
  bundle,
  draw,
  effect,
  frame,
  geometry,
  init,
  sampler,
  surface,
  target,
  texture,
  uniforms,
  type Bundle,
  type Draw,
  type Geometry,
  type Gpu,
  type Surface,
  type Target,
  type Texture,
} from "vgpu"

import standardShader from "./standard.wgsl"
import roomEnvShader from "./room-env.wgsl"
import { DFG_LUT } from "./dfg-lut"

/**
 * A three.js renderer whose every pixel is drawn by vgpu (WebGPU).
 *
 * three.js stays the scene graph: models load through GLTFLoader, React Three
 * Fiber builds and animates `Object3D`s exactly as before, and R3F calls
 * `render(scene, camera)` each frame as it would on a WebGLRenderer. This class
 * turns that scene into vgpu work:
 *
 *  - each mesh becomes one vgpu `draw` (its geometry uploaded once, pipelines
 *    shared device-wide by shader + options), shaded by standard.wgsl, a WGSL
 *    port of three's physical lighting;
 *  - camera, lights, exposure and environment strength are one shared
 *    `uniforms(gpu)` block, written once per frame;
 *  - per-mesh matrices and material values are `set()` only when they change,
 *    so static meshes cost an encode and nothing else;
 *  - the image-based lighting is three's RoomEnvironment, ray-traced and
 *    GGX-prefiltered into an atlas once at startup (room-env.wgsl);
 *  - `compileAsync` (called by `Prewarm`) uploads everything and compiles every
 *    pipeline off the main thread before the card is shown.
 *
 * Scope: Mesh with MeshStandard/MeshPhysical/MeshBasic materials, color and
 * alpha maps, ambient, directional and point lights, AgX tone mapping, no
 * shadows (the scenes here use blob textures instead). Anything else in a
 * scene is skipped.
 */

const CLIP_FIX = new THREE.Matrix4().set(
  // three's projection maps depth to -1..1 (WebGL); WebGPU clips to 0..1
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 0.5, 0.5,
  0, 0, 0, 1
)

const MAX_IN_FLIGHT = 2

const BLEND_NORMAL = {
  // three's NormalBlending into a premultiplied canvas
  color: { src: "src-alpha", dst: "one-minus-src-alpha" },
  alpha: { src: "one", dst: "one-minus-src-alpha" },
} as const

const ENV_LEVELS: { rect: [number, number, number, number]; samples: number }[] = [
  { rect: [0, 0, 256, 128], samples: 0 },
  { rect: [0, 128, 128, 64], samples: 64 },
  { rect: [0, 192, 64, 32], samples: 128 },
  { rect: [0, 224, 32, 16], samples: 256 },
  { rect: [0, 240, 32, 16], samples: 256 },
  { rect: [0, 256, 32, 16], samples: 256 },
  { rect: [0, 272, 32, 16], samples: 256 },
]

type Mat = THREE.MeshStandardMaterial & Partial<THREE.MeshPhysicalMaterial> & { isMeshBasicMaterial?: boolean }

interface Rec {
  draw: Draw
  geometry: THREE.BufferGeometry
  material: Mat
  mirrored: boolean
  matrix: Float32Array
  matSig: string
  transparent: boolean
  renderOrder: number
  z: number
}

export class VgpuRenderer {
  readonly isVgpuRenderer = true
  readonly domElement: HTMLCanvasElement
  // what React Three Fiber reads and writes on a renderer
  shadowMap = { enabled: false, type: THREE.PCFShadowMap as THREE.ShadowMapType, needsUpdate: false }
  toneMapping: THREE.ToneMapping = THREE.NoToneMapping
  toneMappingExposure = 1
  outputColorSpace: THREE.ColorSpace = THREE.SRGBColorSpace
  debug = { checkShaderErrors: false }
  info = { render: { calls: 0, triangles: 0, frame: 0, ms: 0 } }

  /** Test hook (`?vgpu-debug` in the URL): render offscreen so the frame can be read back. */
  private offscreen: Target | null = null
  /** The scene recorded as [opaque, transparent] bundles, and what they were recorded from. */
  private bundles: [Bundle, Bundle] | null = null
  private bundleCamera = ""
  private bundleRecs: Rec[] = []
  /** Frames submitted but not finished on the GPU; past MAX_IN_FLIGHT, render() skips. */
  private inFlight = 0
  private width = 1
  private height = 1
  private pixelRatio = 1
  private disposed = false
  private readonly recs = new Map<THREE.Mesh, Rec>()
  private readonly geometries = new WeakMap<THREE.BufferGeometry, Geometry>()
  private readonly textures = new WeakMap<THREE.Texture, { tex: Texture; version: number }>()
  private readonly n3 = new THREE.Matrix3()
  private readonly v3 = new THREE.Vector3()
  private readonly v3b = new THREE.Vector3()

  private constructor(
    canvas: HTMLCanvasElement,
    private readonly gpu: Gpu,
    private readonly view: Surface,
    private readonly sceneU: ReturnType<typeof uniforms>,
    private readonly env: Target,
    private readonly dfg: Texture,
    private readonly white: Texture,
    private readonly mapSampler: GPUSampler,
    private readonly clampSampler: GPUSampler
  ) {
    this.domElement = canvas
  }

  static async create(canvas: HTMLCanvasElement): Promise<VgpuRenderer> {
    const gpu = await init({ powerPreference: "high-performance" })
    try {
      gpu.onError((e) => {
        const err = e as { code?: string; message?: string; detail?: unknown }
        console.error("[vgpu-three]", err.code, err.message, err.detail ?? "")
      })
      const view = surface(gpu, canvas, { size: [1, 1], depth: true, msaa: true, alphaMode: "premultiplied", clearColor: [0, 0, 0, 0] })

      // three's DFG LUT for the split-sum terms
      const dfg = texture(gpu, { kind: "2d", size: [16, 16], format: "rg16float", usage: ["texture_binding", "copy_dst"] })
      gpu.gpu.queue.writeTexture({ texture: dfg.gpu }, DFG_LUT, { bytesPerRow: 16 * 4 }, [16, 16])
      // stands in for an absent map / alphaMap
      const white = texture(gpu, { kind: "2d", size: [1, 1], format: "rgba8unorm", usage: ["texture_binding", "copy_dst"] })
      gpu.gpu.queue.writeTexture({ texture: white.gpu }, new Uint8Array([255, 255, 255, 255]), { bytesPerRow: 4 }, [1, 1])
      const clampSampler = sampler(gpu, { minFilter: "linear", magFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" })
      const mapSampler = sampler(gpu, {
        minFilter: "linear",
        magFilter: "linear",
        mipmapFilter: "linear",
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
        maxAnisotropy: 8,
      })

      // Bake the room environment once (vgpu: "bake static inputs once").
      const env = target(gpu, { size: [256, 288], format: "rgba16float" })
      const bake = effect(gpu, roomEnvShader, { label: "vgpu-three.room-env", set: { bake: { rect: [0, 0, 1, 1], roughness: 0, samples: 0 } } })
      await bake.compile(env)
      frame(gpu, (f) => {
        ENV_LEVELS.forEach((level, i) => {
          const [x, y, w, h] = level.rect
          bake.set({ bake: { rect: level.rect, roughness: i / (ENV_LEVELS.length - 1), samples: level.samples } })
          f.pass({ target: env, clear: i === 0 ? [0, 0, 0, 1] : false, viewport: { x, y, width: w, height: h }, scissor: [x, y, w, h] }, bake)
        })
      })

      const sceneU = uniforms(gpu, {
        viewProj: new Float32Array(16),
        cameraPos: [0, 0, 0],
        exposure: 1,
        ambient: [0, 0, 0],
        envIntensity: 0,
        dirDir: [[0, 1, 0, 0], [0, 1, 0, 0]],
        dirColor: [[0, 0, 0, 0], [0, 0, 0, 0]],
        pointPos: [[0, 0, 0, 0], [0, 0, 0, 0]],
        pointColor: [[0, 0, 0, 2], [0, 0, 0, 2]],
        counts: [0, 0, 0, 0],
      })
      const renderer = new VgpuRenderer(canvas, gpu, view, sceneU, env, dfg, white, mapSampler, clampSampler)
      if (typeof location !== "undefined" && new URLSearchParams(location.search).has("vgpu-debug")) {
        renderer.offscreen = target(gpu, { size: [1, 1], format: view.format, depth: true, msaa: true })
        ;(window as unknown as { __vgpuThree?: VgpuRenderer }).__vgpuThree = renderer
      }
      return renderer
    } catch (err) {
      gpu.dispose()
      throw err
    }
  }

  /* ------------------------------------------------- WebGLRenderer surface */

  setPixelRatio(ratio: number) {
    this.pixelRatio = ratio
    this.resize()
  }
  getPixelRatio() {
    return this.pixelRatio
  }
  setSize(width: number, height: number, updateStyle = true) {
    this.width = width
    this.height = height
    if (updateStyle) {
      this.domElement.style.width = `${width}px`
      this.domElement.style.height = `${height}px`
    }
    this.resize()
  }
  getSize(out: THREE.Vector2) {
    return out.set(this.width, this.height)
  }
  getDrawingBufferSize(out: THREE.Vector2) {
    return out.set(this.view.size[0], this.view.size[1])
  }
  private resize() {
    if (this.disposed) return
    const size = [Math.max(1, Math.floor(this.width * this.pixelRatio)), Math.max(1, Math.floor(this.height * this.pixelRatio))] as const
    this.view.resize(size)
    this.offscreen?.resize(size)
  }

  /** Test hook: the last frame's pixels (RGBA), when rendering offscreen. */
  async readPixels() {
    if (!this.offscreen) throw new Error("readPixels needs ?vgpu-debug")
    await this.gpu.settled()
    const pixels = await this.offscreen.color.read({ mipLevel: 0, region: "all" })
    return { pixels, size: this.offscreen.size }
  }

  /** Uploads every mesh in `scene` and compiles its pipeline without blocking. */
  async compileAsync(scene: THREE.Object3D, _camera?: THREE.Camera) {
    scene.updateMatrixWorld()
    const draws = new Set<Draw>()
    scene.traverse((o) => {
      const rec = this.rec(o as THREE.Mesh)
      if (rec) draws.add(rec.draw)
    })
    await Promise.all([...draws].map((d) => d.compile(this.view)))
  }
  compile(scene: THREE.Object3D, camera?: THREE.Camera) {
    void this.compileAsync(scene, camera)
  }

  forceContextLoss() {
    this.dispose()
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.bundles?.forEach((b) => b.dispose())
    this.bundles = null
    this.recs.clear()
    this.gpu.dispose()
  }

  /* ---------------------------------------------------------------- render */

  render(scene: THREE.Scene, camera: THREE.Camera) {
    if (this.disposed || this.gpu.disposed) return
    // A GPU that can't keep up would otherwise queue a frame per tick without
    // bound; drop this tick instead, and the next one renders the newer state.
    if (this.inFlight >= MAX_IN_FLIGHT) return
    const t0 = performance.now()
    if (scene.matrixWorldAutoUpdate) scene.updateMatrixWorld()
    if (camera.parent === null && camera.matrixWorldAutoUpdate) camera.updateMatrixWorld()

    this.updateScene(scene, camera)

    // Every visible mesh's draw, with its matrix and material set() if they
    // changed. Animated parts update this way inside the recorded bundles:
    // bundles replay live buffers, so a set() reaches the next replay.
    const visible: Rec[] = []
    const seen = new Set<THREE.Mesh>()
    scene.traverseVisible((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const rec = this.rec(mesh)
      if (!rec) return
      seen.add(mesh)
      rec.renderOrder = mesh.renderOrder
      this.sync(mesh, rec)
      visible.push(rec)
    })
    // forget meshes that left the scene
    for (const mesh of this.recs.keys()) if (!seen.has(mesh) && !mesh.parent) this.drop(mesh)

    // Record the scene into two bundles (opaque, then transparent) and replay
    // them every frame: vgpu's default for draws that repeat. Re-record only
    // when what is drawn, or the camera that orders it, changes.
    const camKey = camera.matrixWorld.elements.join(",") + "|" + camera.projectionMatrix.elements.join(",")
    if (!this.bundles || camKey !== this.bundleCamera || !sameRecs(visible, this.bundleRecs)) {
      this.record(visible, camera)
      this.bundleCamera = camKey
      this.bundleRecs = visible
    }
    const [opaque, transparent] = this.bundles!

    const submitted = frame(this.gpu, (f) =>
      f.pass({ target: this.offscreen ?? this.view, clear: [0, 0, 0, 0] }, (p) => p.bundles(opaque, transparent))
    )
    this.inFlight++
    const settle = () => void this.inFlight--
    submitted.done.then(settle, settle)
    this.info.render.calls = visible.length
    this.info.render.frame++
    this.info.render.ms += performance.now() - t0
    if (this.offscreen) (window as unknown as { __vgpuThree?: VgpuRenderer }).__vgpuThree = this
  }

  /**
   * Records the visible meshes in three's draw order: opaque front to back,
   * then transparent back to front, `renderOrder` first. No frustum culling:
   * an animated part must not vanish because it was off screen when recorded.
   */
  private record(visible: Rec[], camera: THREE.Camera) {
    const camPos = this.v3.setFromMatrixPosition(camera.matrixWorld)
    for (const r of visible) r.z = this.v3b.fromArray(r.matrix, 12).distanceToSquared(camPos)
    const order = (a: Rec, b: Rec, sign: number) =>
      a.renderOrder !== b.renderOrder ? a.renderOrder - b.renderOrder : sign * (a.z - b.z)
    const opaque = visible.filter((r) => !r.transparent).sort((a, b) => order(a, b, 1))
    const transparent = visible.filter((r) => r.transparent).sort((a, b) => order(a, b, -1))
    const target = this.offscreen ?? this.view
    const next: [Bundle, Bundle] = [
      bundle(this.gpu, { target, label: "vgpu-three.opaque" }, (b) => opaque.forEach((r) => b.draw(r.draw))),
      bundle(this.gpu, { target, label: "vgpu-three.transparent" }, (b) => transparent.forEach((r) => b.draw(r.draw))),
    ]
    // record, swap, then dispose (the order vgpu's bundle docs prescribe)
    const previous = this.bundles
    this.bundles = next
    previous?.forEach((b) => b.dispose())
  }

  /** Camera, lights and exposure: one shared uniform block for every draw. */
  private updateScene(scene: THREE.Scene, camera: THREE.Camera) {
    const ambient = new THREE.Color(0, 0, 0)
    const dirDir: number[][] = []
    const dirColor: number[][] = []
    const pointPos: number[][] = []
    const pointColor: number[][] = []
    scene.traverseVisible((o) => {
      const light = o as THREE.Light
      if (!light.isLight) return
      const c = light.color.clone().multiplyScalar(light.intensity)
      if ((light as THREE.AmbientLight).isAmbientLight) ambient.add(c)
      else if ((light as THREE.DirectionalLight).isDirectionalLight && dirDir.length < 2) {
        const d = light as THREE.DirectionalLight
        const dir = new THREE.Vector3().setFromMatrixPosition(d.matrixWorld).sub(new THREE.Vector3().setFromMatrixPosition(d.target.matrixWorld)).normalize()
        dirDir.push([dir.x, dir.y, dir.z, 0])
        dirColor.push([c.r, c.g, c.b, 0])
      } else if ((light as THREE.PointLight).isPointLight && pointPos.length < 2) {
        const pl = light as THREE.PointLight
        const p = new THREE.Vector3().setFromMatrixPosition(pl.matrixWorld)
        pointPos.push([p.x, p.y, p.z, pl.distance])
        pointColor.push([c.r, c.g, c.b, pl.decay])
      }
    })
    const counts = [dirDir.length, pointPos.length, this.toneMapping === THREE.AgXToneMapping ? 1 : 0, 0]
    while (dirDir.length < 2) dirDir.push([0, 1, 0, 0]), dirColor.push([0, 0, 0, 0])
    while (pointPos.length < 2) pointPos.push([0, 0, 0, 0]), pointColor.push([0, 0, 0, 2])

    const vp = new THREE.Matrix4().multiplyMatrices(CLIP_FIX, camera.projectionMatrix).multiply(camera.matrixWorldInverse)
    const cam = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld)
    const hasEnv = scene.environment !== null || scene.userData.vgpuRoomEnvironment === true
    this.sceneU.set({
      viewProj: new Float32Array(vp.elements),
      cameraPos: [cam.x, cam.y, cam.z],
      exposure: this.toneMappingExposure,
      ambient: [ambient.r, ambient.g, ambient.b],
      envIntensity: hasEnv ? scene.environmentIntensity : 0,
      dirDir,
      dirColor,
      pointPos,
      pointColor,
      counts,
    })
  }

  /* --------------------------------------------------------------- meshes */

  private rec(mesh: THREE.Mesh): Rec | null {
    if (!mesh.isMesh || Array.isArray(mesh.material) || !mesh.material) return null
    const material = mesh.material as Mat
    if (!material.isMeshStandardMaterial && !material.isMeshBasicMaterial) return null
    const mirrored = mesh.matrixWorld.determinant() < 0
    const existing = this.recs.get(mesh)
    if (existing && existing.geometry === mesh.geometry && existing.material === material && existing.mirrored === mirrored) return existing
    if (existing) this.drop(mesh)

    const transparent = material.transparent || (material.transmission ?? 0) > 0
    const cull: "none" | "front" | "back" =
      material.side === THREE.DoubleSide ? "none" : material.side === THREE.BackSide ? "front" : "back"
    const d = draw(this.gpu, {
      label: mesh.name || "mesh",
      shader: standardShader,
      geometry: this.geometry(mesh.geometry),
      cull,
      // a mirrored world matrix flips the winding, as three flips frontFace
      frontFace: mirrored ? "cw" : "ccw",
      blend: transparent ? BLEND_NORMAL : undefined,
      depth: { write: material.depthWrite, compare: material.depthTest ? "less-equal" : "always" },
      set: {
        scene: this.sceneU,
        envAtlas: this.env,
        dfgLUT: this.dfg,
        clampSampler: this.clampSampler,
        mapSampler: this.mapSampler,
      },
    })
    const rec: Rec = { draw: d, geometry: mesh.geometry, material, mirrored, matrix: new Float32Array(16).fill(NaN), matSig: "", transparent, renderOrder: mesh.renderOrder, z: 0 }
    this.sync(mesh, rec)
    this.recs.set(mesh, rec)
    return rec
  }

  private drop(mesh: THREE.Mesh) {
    const rec = this.recs.get(mesh)
    if (!rec) return
    // disposing a recorded draw stales the bundles that hold it: re-record first
    this.bundleRecs = []
    rec.draw.dispose()
    this.recs.delete(mesh)
  }

  /** set() only what changed: the matrix when the mesh moved, the material when edited. */
  private sync(mesh: THREE.Mesh, rec: Rec) {
    const e = mesh.matrixWorld.elements
    let moved = false
    for (let i = 0; i < 16; i++) if (rec.matrix[i] !== e[i]) { moved = true; break }
    if (moved) {
      rec.matrix.set(e)
      this.n3.getNormalMatrix(mesh.matrixWorld)
      const n = this.n3.elements
      rec.draw.set({
        object: {
          model: rec.matrix,
          normalMatrix: [n[0], n[1], n[2], 0, n[3], n[4], n[5], 0, n[6], n[7], n[8], 0, 0, 0, 0, 1],
        },
      })
    }
    const m = rec.material
    const sig = materialSignature(m, this)
    if (sig !== rec.matSig) {
      rec.matSig = sig
      rec.draw.set({ material: materialValues(m), map: this.texture(m.map, true), alphaMap: this.texture(m.alphaMap, false) })
    }
  }

  private geometry(g: THREE.BufferGeometry): Geometry {
    const cached = this.geometries.get(g)
    if (cached) return cached
    const pos = g.getAttribute("position")
    if (!g.getAttribute("normal")) g.computeVertexNormals()
    const nrm = g.getAttribute("normal")
    const uv = g.getAttribute("uv")
    const n = pos.count
    // dequantise to float32: KHR_mesh_quantization and interleaved layouts
    // all read the same way through getX/Y/Z
    const P = new Float32Array(n * 3)
    const N = new Float32Array(n * 3)
    const U = new Float32Array(n * 2)
    for (let i = 0; i < n; i++) {
      P[i * 3] = pos.getX(i)
      P[i * 3 + 1] = pos.getY(i)
      P[i * 3 + 2] = pos.getZ(i)
      N[i * 3] = nrm.getX(i)
      N[i * 3 + 1] = nrm.getY(i)
      N[i * 3 + 2] = nrm.getZ(i)
      if (uv) {
        U[i * 2] = uv.getX(i)
        U[i * 2 + 1] = uv.getY(i)
      }
    }
    let indices: Uint16Array | Uint32Array | undefined
    if (g.index) {
      const a = g.index.array
      indices = a instanceof Uint16Array || a instanceof Uint32Array ? a : Uint32Array.from(a as ArrayLike<number>)
    }
    const geo = geometry(this.gpu, {
      label: g.name || "geometry",
      buffers: [
        { attributes: { position: "float32x3" }, data: P },
        { attributes: { normal: "float32x3" }, data: N },
        { attributes: { uv: "float32x2" }, data: U },
      ],
      indices,
    })
    this.geometries.set(g, geo)
    return geo
  }

  /** Uploads a canvas/image texture with a mip chain built on the CPU. */
  private texture(t: THREE.Texture | null | undefined, color: boolean): Texture {
    if (!t || !t.image) return this.white
    const cached = this.textures.get(t)
    if (cached && cached.version === t.version) return cached.tex
    const img = t.image as HTMLCanvasElement | HTMLImageElement | ImageBitmap
    const w = (img as HTMLCanvasElement).width
    const h = (img as HTMLCanvasElement).height
    if (!w || !h) return this.white
    const levels = Math.floor(Math.log2(Math.max(w, h))) + 1
    const srgb = color && t.colorSpace === THREE.SRGBColorSpace
    const tex = texture(this.gpu, {
      kind: "2d",
      size: [w, h],
      format: srgb ? "rgba8unorm-srgb" : "rgba8unorm",
      mipLevelCount: levels,
      usage: ["texture_binding", "copy_dst", "render_attachment"],
    })
    let src: CanvasImageSource = img
    let sw = w
    let sh = h
    for (let level = 0; level < levels; level++) {
      this.gpu.gpu.queue.copyExternalImageToTexture({ source: src as GPUCopyExternalImageSource, flipY: t.flipY }, { texture: tex.gpu, mipLevel: level }, [sw, sh])
      if (level === levels - 1) break
      const nw = Math.max(1, sw >> 1)
      const nh = Math.max(1, sh >> 1)
      const c = document.createElement("canvas")
      c.width = nw
      c.height = nh
      const g = c.getContext("2d")!
      g.imageSmoothingQuality = "high"
      g.drawImage(src, 0, 0, nw, nh)
      src = c
      sw = nw
      sh = nh
    }
    if (cached) {
      // a different texture bound after recording stales the bundles
      this.bundleRecs = []
      cached.tex.destroy()
    }
    this.textures.set(t, { tex, version: t.version })
    return tex
  }
}

function sameRecs(a: Rec[], b: Rec[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function materialSignature(m: Mat, r: VgpuRenderer) {
  return [
    m.version,
    m.color.getHex(),
    m.opacity,
    m.emissive?.getHex(),
    m.emissiveIntensity,
    m.roughness,
    m.metalness,
    m.map?.version,
    m.alphaMap?.version,
    m.toneMapped,
    r.toneMapping,
  ].join("|")
}

function materialValues(m: Mat) {
  const standard = !!m.isMeshStandardMaterial
  const physical = !!m.isMeshPhysicalMaterial
  const emissive = standard ? m.emissive.clone().multiplyScalar(m.emissiveIntensity) : new THREE.Color(0, 0, 0)
  const transmission = physical ? m.transmission ?? 0 : 0
  const flags =
    (m.map ? 1 : 0) | (m.alphaMap ? 2 : 0) | (standard ? 0 : 4) | (m.toneMapped ? 8 : 0) | (m.side === THREE.DoubleSide ? 16 : 0)
  return {
    color: [m.color.r, m.color.g, m.color.b],
    // transmission is drawn as see-through rather than refracted
    opacity: m.opacity * (1 - 0.85 * transmission),
    emissive: [emissive.r, emissive.g, emissive.b],
    roughness: standard ? m.roughness : 1,
    metalness: standard ? m.metalness : 0,
    ior: physical ? m.ior ?? 1.5 : 1.5,
    specularIntensity: physical ? m.specularIntensity ?? 1 : 1,
    clearcoat: physical ? m.clearcoat ?? 0 : 0,
    clearcoatRoughness: physical ? m.clearcoatRoughness ?? 0 : 0,
    transmission,
    flags,
    pad: 0,
  }
}

export function createVgpuRenderer(canvas: HTMLCanvasElement) {
  return VgpuRenderer.create(canvas)
}
