// Copies detect-gpu's benchmark tables into public/ so the GPU-tier quality
// signal fetches them same-origin and pinned to the installed version, as
// vgpu's adaptive-quality guide recommends. Runs before `dev` and `build`.
import { cpSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

const require = createRequire(import.meta.url)
const pkg = dirname(require.resolve("detect-gpu/package.json"))
const from = join(pkg, "dist", "benchmarks")
const to = join(process.cwd(), "public", "gpu-benchmarks")
if (!existsSync(from)) {
  console.warn(`[gpu-benchmarks] ${from} not found; the GPU-tier signal will keep High`)
} else {
  cpSync(from, to, { recursive: true })
  console.log(`[gpu-benchmarks] copied to ${to}`)
}
