import { use } from "react"
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { MODELS, MODEL_KEY } from "./models.generated"

/**
 * Loads the bench's models from their encrypted packs (scripts/pack-models.mjs):
 * fetch, decrypt with WebCrypto, then parse with three's GLTFLoader. Both
 * models are meshopt-compressed, whose decoder ships in the bundle, so nothing
 * is fetched from a third-party CDN (drei's useGLTF pulled Draco from gstatic).
 */

export type ModelName = keyof typeof MODELS

const cache = new Map<ModelName, Promise<GLTF>>()
let keyPromise: Promise<CryptoKey> | null = null
let loader: GLTFLoader | null = null

const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

function cryptoKey() {
  keyPromise ??= crypto.subtle.importKey("raw", bytes(MODEL_KEY), "AES-GCM", false, ["decrypt"])
  return keyPromise
}

async function fetchModel(name: ModelName): Promise<GLTF> {
  const { url, iv } = MODELS[name]
  const res = await fetch(url, { credentials: "same-origin" })
  if (!res.ok) throw new Error(`[models] ${name}: HTTP ${res.status}`)
  const sealed = await res.arrayBuffer()
  const glb = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(iv) }, await cryptoKey(), sealed)
  if (!loader) {
    loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
  }
  return loader.parseAsync(glb, "")
}

/** Starts loading a model (cached for the page's lifetime). */
export function loadModel(name: ModelName): Promise<GLTF> {
  let p = cache.get(name)
  if (!p) {
    p = fetchModel(name)
    // a failed load can be retried on the next mount
    p.catch(() => cache.delete(name))
    cache.set(name, p)
  }
  return p
}

/** Suspends until the model is ready, like drei's useGLTF. */
export function useModel(name: ModelName): GLTF {
  return use(loadModel(name))
}

/** Warms the cache ahead of the component that needs it. */
export function preloadModel(name: ModelName) {
  if (typeof window === "undefined") return
  void loadModel(name).catch(() => {
    // the component reports it when it mounts
  })
}
