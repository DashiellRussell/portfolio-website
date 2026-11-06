import type { DowngradeReason, QualityPreference, QualityState } from "./quality"
import type { FrameHealthSample } from "./frame-health"
import type { QualitySignals } from "./quality-signals"

/**
 * Site-wide render quality, following vgpu's adaptive-quality guide: every
 * visitor starts High, advisory signals (GPU tier, battery, presented-frame
 * health) can ask for Low, and the only automatic move is High -> Low, once.
 * Nothing upgrades on its own, so there is no oscillation.
 *
 * It is one state for the whole page rather than one per card: a device that
 * cannot hold one card's High pipeline will not hold the next one's, so cards
 * mounted after a downgrade start on Low instead of failing again.
 *
 * `?quality=low` or `?quality=high` forces a tier (the guide's user override).
 */

type Listener = (state: QualityState) => void

function initialPreference(): QualityPreference {
  if (typeof window === "undefined") return "auto"
  const q = new URLSearchParams(window.location.search).get("quality")
  return q === "low" || q === "high" ? q : "auto"
}

const preference = initialPreference()
let state: QualityState = {
  preference,
  effective: preference === "low" ? "low" : "high",
  reason: preference === "auto" ? "initial" : "forced",
}
const listeners = new Set<Listener>()

export function qualityState(): QualityState {
  return state
}

export function subscribeQuality(fn: Listener): () => void {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

/** No-op unless the preference is auto and High is on screen. */
export function downgradeQuality(reason: DowngradeReason) {
  if (state.preference !== "auto" || state.effective !== "high") return
  state = { preference: "auto", effective: "low", reason }
  console.info("[quality] Switched to Low.", { reason })
  listeners.forEach((fn) => fn(state))
}

/** Same-origin copy of detect-gpu's tables, copied into public/ by `npm run build` / `dev`. */
const BENCHMARKS_URL = "/gpu-benchmarks"

/**
 * One renderer's view of the signals. Call `frame()` once per animation tick;
 * the signals arm themselves after the first presented frame (a rAF, then a
 * timeout, then a dynamic import), so neither their code nor detect-gpu's
 * request can delay first paint. They stop once the page is no longer on
 * Auto/High.
 */
export function qualityProbe() {
  let signals: QualitySignals | null = null
  let scheduled = false
  let disposed = false

  const stop = () => {
    signals?.dispose()
    signals = null
  }
  const unsubscribe = subscribeQuality((s) => {
    if (s.effective !== "high") stop()
  })

  const arm = () => {
    if (scheduled || disposed) return
    scheduled = true
    requestAnimationFrame(() =>
      setTimeout(() => {
        if (disposed || state.preference !== "auto" || state.effective !== "high") return
        void import("./quality-signals")
          .then(({ createQualitySignals }) => {
            if (disposed || state.effective !== "high") return
            signals = createQualitySignals({ onDowngrade: downgradeQuality, benchmarksUrl: BENCHMARKS_URL })
          })
          .catch(() => {
            // advisory: if the signals fail to load, stay on High
          })
      }, 0)
    )
  }

  return {
    /** One sample per animation tick, while this renderer is on screen and animating. */
    frame(sample: FrameHealthSample) {
      if (disposed || state.preference !== "auto" || state.effective !== "high") return
      if (sample.rendered) arm()
      signals?.recordFrame(sample)
    },
    /** After a resize or anything else that legitimately changes the frame rate. */
    reset() {
      signals?.resetHealth()
    },
    dispose() {
      disposed = true
      unsubscribe()
      stop()
    },
  }
}
