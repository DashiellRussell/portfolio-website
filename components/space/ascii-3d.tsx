"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { monoFamily, observeVisibility } from "@/lib/canvas"

/**
 * 3D → ASCII renderer.
 *
 * Renders a real three.js scene into a tiny offscreen render target — one
 * texel per character cell — then reads the luminance back and maps it onto a
 * glyph ramp. Because the target is only ~cols×rows texels (a few thousand
 * pixels), the per-frame GPU→CPU read is cheap enough to run every frame.
 *
 * Falls back to the noise field if WebGL is unavailable.
 */

/** Dark → light. Index maps directly to a luminance bucket. */
const RAMP = " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"

const CELL_W = 7
const CELL_H = 12
/** Supersample factor — smooths the silhouette before it hits the glyph ramp. */
const SS = 2
/**
 * Quantisation levels per colour channel.
 *
 * Glyphs are tinted with the scene's actual rendered colour, not just its
 * luminance, so materials read as materials — blue arrays stay blue. Colour is
 * quantised so neighbouring cells still collapse into batched runs; 5 levels
 * per channel keeps runs long while preserving the palette.
 */
const LEVELS = 5

interface Props {
  className?: string
  /**
   * 0..1, drives the model's roll. Passed as a ref rather than a value so
   * scroll can scrub the render every frame without re-rendering React.
   */
  progressRef?: { current: number }
}

/**
 * Builds the vehicle procedurally so there is no model to load and the
 * silhouette is tuned for legibility once it is quantised to ~50 rows.
 */
function buildRocket(): THREE.Group {
  const g = new THREE.Group()

  // Matte material — specular highlights quantise badly into a glyph ramp.
  const skin = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const dark = new THREE.MeshLambertMaterial({ color: 0x5a5a5a })

  // Slender and tall: a long airframe reads far better once it is quantised
  // to a character grid than a stubby one does.
  const R = 0.34
  const BODY_H = 4.6

  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, BODY_H, 24), skin)
  g.add(body)

  const noseH = 1.6
  const nose = new THREE.Mesh(new THREE.ConeGeometry(R, noseH, 24), skin)
  nose.position.y = BODY_H / 2 + noseH / 2
  g.add(nose)

  // Interstage band
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, 0.2, 24), dark)
  band.position.y = 0.7
  g.add(band)

  // ---- Fins ----
  // Each fin hangs off its own pivot so the blade and its radial offset share
  // one rotation. Setting rotation and position independently (the previous
  // approach) made them disagree and the fins floated off the hull.
  const finShape = new THREE.Shape()
  finShape.moveTo(0, 0)
  finShape.lineTo(0.8, -0.44)
  finShape.lineTo(0.8, -0.82)
  finShape.lineTo(0, -0.58)
  finShape.lineTo(0, 0)
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.045, bevelEnabled: false })
  // Extrusion runs 0..depth; recentre so the blade straddles its own plane.
  finGeo.translate(0, 0, -0.0225)

  // Quarter turn clockwise viewed from above (negative Y in three's frame).
  const FIN_PHASE = -Math.PI / 2

  for (let i = 0; i < 4; i++) {
    const pivot = new THREE.Group()
    pivot.rotation.y = FIN_PHASE + (i * Math.PI) / 2

    const fin = new THREE.Mesh(finGeo, skin)
    // Local +X is radially outward within the pivot's frame.
    fin.position.set(R * 0.92, -BODY_H / 2 + 0.72, 0)
    pivot.add(fin)
    g.add(pivot)
  }

  // Engine bell
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.62, R * 1.15, 0.55, 20, 1, true),
    dark
  )
  bell.position.y = -BODY_H / 2 - 0.24
  g.add(bell)

  return g
}

/**
 * 3U cubesat with deployed arrays. Kept blocky on purpose — at this glyph
 * resolution a detailed bus turns to mush, whereas flat panels and hard edges
 * quantise cleanly and stay readable.
 */
function buildCubesat(): THREE.Group {
  const g = new THREE.Group()

  // Bright structure, saturated arrays: the ASCII pass tints glyphs with the
  // rendered colour, so material choice is what puts colour on screen here.
  const skin = new THREE.MeshLambertMaterial({ color: 0xf2f6ff })
  const rail = new THREE.MeshLambertMaterial({ color: 0x9aa6b8 })
  // Emissive keeps the arrays blue even on faces the key light misses.
  const panelMat = new THREE.MeshLambertMaterial({
    color: 0x2f6bff,
    emissive: 0x0f2f8c,
    emissiveIntensity: 0.9,
  })
  const gold = new THREE.MeshLambertMaterial({ color: 0xd9a441 })

  // 3U: 1×1×3 units.
  const W = 0.62
  const H = 1.86

  const bus = new THREE.Mesh(new THREE.BoxGeometry(W, H, W), skin)
  g.add(bus)

  // Corner rails.
  const railGeo = new THREE.BoxGeometry(0.07, H + 0.03, 0.07)
  for (const [sx, sz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    const r = new THREE.Mesh(railGeo, rail)
    r.position.set((sx * W) / 2, 0, (sz * W) / 2)
    g.add(r)
  }

  // Deployed arrays, one per side, angled slightly out of plane.
  const panelGeo = new THREE.BoxGeometry(1.5, 1.5, 0.035)
  for (const side of [1, -1]) {
    const wing = new THREE.Group()
    const panel = new THREE.Mesh(panelGeo, panelMat)
    panel.position.x = side * (0.75 + W / 2 + 0.12)
    wing.add(panel)

    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.3, 8), skin)
    boom.rotation.z = Math.PI / 2
    boom.position.x = side * (W / 2 + 0.12)
    wing.add(boom)

    wing.rotation.x = side * 0.1
    g.add(wing)
  }

  // Antenna
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.7, 6), skin)
  ant.position.y = H / 2 + 0.35
  g.add(ant)

  // Gold MLI wrap on the lower bay — a second colour keeps the bus from
  // reading as one flat white block.
  const mli = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.44, W + 0.02), gold)
  mli.position.y = -H / 2 + 0.34
  g.add(mli)

  return g
}

export function Ascii3D({ className = "", progressRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fallbackProgress = useRef(0)
  const progress = progressRef ?? fallbackProgress
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    } catch {
      setFailed(true)
      return
    }
    if (!renderer.getContext()) {
      setFailed(true)
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 8)

    // Strong key + soft fill: we need a wide, even luminance spread so the
    // glyph ramp uses its full range instead of clumping mid-grey.
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(3, 2.5, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffffff, 1.1)
    rim.position.set(-4, 1, -2)
    scene.add(rim)
    scene.add(new THREE.AmbientLight(0xffffff, 0.32))

    // The holder carries placement (offset to one side, scale); the rocket
    // itself only ever spins. Keeping them separate stops the scroll scrub
    // from fighting the layout.
    const holder = new THREE.Group()
    const rocket = buildRocket()
    rocket.rotation.z = 0.16
    holder.add(rocket)
    scene.add(holder)

    // Cubesat sits opposite the rocket, further back and tumbling slowly, so
    // the two vehicles read as a pair rather than competing for the frame.
    const satHolder = new THREE.Group()
    const cubesat = buildCubesat()
    satHolder.add(cubesat)
    scene.add(satHolder)

    let cols = 0
    let rows = 0
    let target: THREE.WebGLRenderTarget | null = null
    let buf = new Uint8Array(0)
    let raf = 0
    let visible = false
    let disposed = false

    function resize() {
      if (!canvas || !ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w === 0 || h === 0) return

      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.max(8, Math.ceil(w / CELL_W))
      rows = Math.max(8, Math.ceil(h / CELL_H))

      target?.dispose()
      target = new THREE.WebGLRenderTarget(cols * SS, rows * SS, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      })
      // Without this the readback is LINEAR, not sRGB, and every colour comes
      // back darker and less saturated than the material actually is.
      target.texture.colorSpace = THREE.SRGBColorSpace
      buf = new Uint8Array(cols * SS * rows * SS * 4)

      renderer.setSize(cols * SS, rows * SS, false)
      // Character cells are taller than wide; compensate so the rocket is not
      // stretched once it is drawn as text.
      const aspect = (cols * CELL_W) / (rows * CELL_H)
      camera.aspect = aspect
      camera.updateProjectionMatrix()

      // Sit the vehicle off to one side so it does not collide with the
      // headline, but pull it back to centre on narrow screens where there is
      // no room beside the text.
      const wide = aspect > 1.1
      holder.position.x = wide ? 2.5 : 0
      holder.scale.setScalar(wide ? 0.82 : 0.6)

      // Cubesat: upper-left on wide screens, hidden on narrow ones where it
      // would sit on top of the headline.
      satHolder.visible = wide
      satHolder.position.set(-2.85, 1.25, -0.6)
      satHolder.scale.setScalar(1.05)

      // Inline the resolved family: canvas cannot read CSS variables.
      ctx.font = `${CELL_H - 1}px ${monoFamily()}`
      ctx.textBaseline = "top"
    }

    function draw(time: number) {
      if (!ctx || !canvas || !target) return

      const p = progress.current
      // ~65 deg/s idle roll, plus a full extra turn across the scroll pass.
      rocket.rotation.y = reduced ? 0.6 : time * 0.00115 + p * Math.PI * 2
      // Gentle pitch so the fins read as 3D rather than a flat silhouette.
      rocket.rotation.x = Math.sin(time * 0.00035) * 0.1 - p * 0.25

      // Free tumble on two axes, slower than the rocket's roll.
      cubesat.rotation.y = time * 0.0005 + p * 1.4
      cubesat.rotation.x = 0.25 + Math.sin(time * 0.00028) * 0.28
      cubesat.rotation.z = Math.sin(time * 0.00019) * 0.2

      renderer.setRenderTarget(target)
      renderer.clear()
      renderer.render(scene, camera)
      renderer.readRenderTargetPixels(target, 0, 0, cols * SS, rows * SS, buf)
      renderer.setRenderTarget(null)

      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      const rowW = cols * SS
      const n = SS * SS

      // Batch cells into runs sharing a colour bucket, so a row costs a few
      // fillText calls rather than one per character.
      let run = ""
      let runStart = 0
      let runBucket = -1
      let runStyle = ""

      const flush = (r: number) => {
        if (run.length > 0 && runBucket >= 0) {
          ctx.fillStyle = runStyle
          ctx.fillText(run, runStart * CELL_W, r * CELL_H)
        }
        run = ""
      }

      for (let r = 0; r < rows; r++) {
        runBucket = -1
        run = ""
        for (let c = 0; c < cols; c++) {
          // Box-filter the SS×SS block for this cell.
          let sr = 0
          let sg = 0
          let sb = 0
          let alpha = 0
          for (let sy = 0; sy < SS; sy++) {
            // WebGL origin is bottom-left; flip vertically.
            const py = rows * SS - 1 - (r * SS + sy)
            const rowOff = py * rowW
            for (let sx = 0; sx < SS; sx++) {
              const idx = (rowOff + c * SS + sx) * 4
              sr += buf[idx]
              sg += buf[idx + 1]
              sb += buf[idx + 2]
              alpha += buf[idx + 3]
            }
          }
          alpha /= n * 255

          let bucket = -1
          let glyph = " "
          let style = ""

          if (alpha >= 0.25) {
            sr /= n * 255
            sg /= n * 255
            sb /= n * 255
            const lum = 0.2126 * sr + 0.7152 * sg + 0.0722 * sb
            glyph = RAMP[Math.min(RAMP.length - 1, Math.floor(lum * RAMP.length))]

            // Lift saturated-but-dark materials (the blue arrays) so they are
            // legible against a near-black page. Gamma pulls the midtones up
            // without blowing out the lit metal.
            const g = 0.82
            const qr = Math.round(Math.pow(sr, g) * (LEVELS - 1))
            const qg = Math.round(Math.pow(sg, g) * (LEVELS - 1))
            const qb = Math.round(Math.pow(sb, g) * (LEVELS - 1))
            bucket = (qr * LEVELS + qg) * LEVELS + qb

            const s = 255 / (LEVELS - 1)
            // Floor the opacity so even the darkest lit face still draws.
            const a = Math.max(0.42, Math.min(1, lum * 1.5 + 0.3))
            style = `rgba(${Math.round(qr * s)}, ${Math.round(qg * s)}, ${Math.round(
              qb * s
            )}, ${a.toFixed(2)})`
          }

          if (bucket !== runBucket) {
            flush(r)
            runBucket = bucket
            runStart = c
            runStyle = style
          }
          run += glyph
        }
        flush(r)
      }
    }

    function loop(t: number) {
      if (disposed || !visible) return
      raf = requestAnimationFrame(loop)
      draw(t)
    }

    function start() {
      if (disposed || reduced) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(loop)
    }

    resize()

    // Never render while scrolled away — this is a GPU readback every frame.
    const unobserve = observeVisibility(canvas, (v) => {
      visible = v && document.visibilityState === "visible"
      if (visible) start()
      else cancelAnimationFrame(raf)
      if (v && reduced) draw(0)
    })

    const onResize = () => {
      resize()
      if (reduced) draw(0)
    }
    window.addEventListener("resize", onResize)

    const onVisibility = () => {
      visible = document.visibilityState === "visible" && visible
      if (visible) start()
      else cancelAnimationFrame(raf)
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      unobserve()
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
      target?.dispose()
      // Materials are shared between meshes, so dispose them once via a set
      // rather than per-mesh (which would double-dispose and warn).
      const materials = new Set<THREE.Material>()
      holder.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          materials.add(o.material as THREE.Material)
        }
      })
      materials.forEach((m) => m.dispose())
      renderer.dispose()
    }
  }, [progress])

  if (failed) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
