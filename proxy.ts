import { NextResponse, type NextRequest } from "next/server"

/**
 * Gate for the encrypted model packs in /_m (scripts/pack-models.mjs).
 *
 * Browsers label every request with Fetch Metadata: where it came from
 * (Sec-Fetch-Site) and what it is for (Sec-Fetch-Mode). The bench's own
 * fetch() is same-origin and not a navigation; typing the URL into the
 * address bar, opening it in a new tab, hotlinking it from another site or a
 * download tool that doesn't fake browser headers are not, and get a 404.
 * Determined scrapers can forge these headers, which is why the packs are
 * also encrypted.
 */
export function proxy(req: NextRequest) {
  const site = req.headers.get("sec-fetch-site")
  const mode = req.headers.get("sec-fetch-mode")
  if (site !== "same-origin" || mode === "navigate") {
    return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } })
  }
  return NextResponse.next()
}

export const config = {
  matcher: "/_m/:path*",
}
