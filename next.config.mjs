import { wgslTurbopackRule } from "@vgpu/wgsl/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // WebGPU shaders (vgpu): `.wgsl` imports are resolved, reflected and
  // minified at build time, so the browser never ships a WGSL parser.
  turbopack: {
    rules: {
      "*.wgsl": wgslTurbopackRule({ minify: true }),
    },
  },
}

export default nextConfig
