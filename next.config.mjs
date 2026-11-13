import { wgslTurbopackRule } from "@vgpu/wgsl/next"

const dev = process.env.NODE_ENV !== "production"

/**
 * Content Security Policy. Scripts and styles may only come from this site
 * ('unsafe-inline' covers the inline bootstrap scripts Next writes into every
 * page; nonces would force every page to render dynamically). 'wasm-unsafe-eval'
 * lets the meshopt decoder compile its WebAssembly. Dev adds 'unsafe-eval' for
 * React's dev tooling and websockets for hot reload.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
  // the WebGL fallback page (public/sims/nozzle.html) loads its font from Google
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  `connect-src 'self' https://api.github.com${dev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=()",
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // don't advertise the framework in every response
  poweredByHeader: false,
  // keep the original source out of production builds' browser bundles
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // the encrypted model packs: a new name every build, so cache forever,
        // and keep them out of search results
        source: "/_m/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ]
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
