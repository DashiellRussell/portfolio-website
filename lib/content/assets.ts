import fs from "node:fs"
import path from "node:path"

/**
 * Build-time check for whether a referenced public asset actually exists.
 *
 * Product artwork is still being produced (Blender / vgpu renders), so panels
 * must degrade to the ASCII backdrop instead of rendering a broken image. Doing
 * this on the server at build time avoids a client-side onError flash.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public")
const cache = new Map<string, boolean>()

export function assetExists(src: string | undefined): boolean {
  if (!src) return false
  // Only ever resolve site-root-relative paths inside public/.
  if (!src.startsWith("/")) return false

  const cached = cache.get(src)
  if (cached !== undefined) return cached

  const resolved = path.join(PUBLIC_DIR, src)
  // Guard against traversal out of public/.
  const ok =
    resolved.startsWith(PUBLIC_DIR) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()

  cache.set(src, ok)
  return ok
}
