/**
 * Canvas helpers shared by the ASCII renderers.
 */

let cachedMono: string | null = null

/**
 * Resolves the real monospace family name for use in a canvas `font` string.
 *
 * Canvas does NOT resolve CSS custom properties — assigning
 * `ctx.font = "12px var(--font-mono)"` is silently ignored and leaves the
 * context on its default `10px sans-serif`. next/font generates a hashed
 * family name, so read the variable's *value* and inline it.
 */
export function monoFamily(): string {
  if (cachedMono) return cachedMono
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-mono-custom")
    .trim()
  cachedMono = v ? `${v}, ui-monospace, monospace` : "ui-monospace, monospace"
  return cachedMono
}

/**
 * Runs `onChange` when the element enters or leaves the viewport, so canvases
 * can stop animating while scrolled away. Returns a disposer.
 */
export function observeVisibility(
  el: Element,
  onChange: (visible: boolean) => void,
  rootMargin = "120px"
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onChange(true)
    return () => {}
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) onChange(e.isIntersecting)
    },
    { rootMargin }
  )
  io.observe(el)
  return () => io.disconnect()
}

/**
 * Reads the live zone accent, re-resolving at most once per `ttl` ms.
 * `getComputedStyle` forces a style recalc, so calling it every frame across
 * several canvases is measurably expensive.
 */
export function makeAccentReader(ttl = 250) {
  let value = "#35d6f0"
  let last = -Infinity
  return (now: number) => {
    if (now - last > ttl) {
      last = now
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim()
      if (v) value = v
    }
    return value
  }
}
