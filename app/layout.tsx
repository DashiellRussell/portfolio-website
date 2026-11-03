import type React from "react"
import type { Metadata } from "next"
import { Archivo, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import { ZoneProvider } from "@/components/space/zone-provider"
import { SiteHeader } from "@/components/space/site-header"
import { Preloader } from "@/components/space/preloader"
import { SiteFooter } from "@/components/space/site-footer"
import "./globals.css"

/** Display: a grotesk that holds up at very large sizes and in all-caps. */
const display = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

/** Mono carries all metadata: labels, specs, telemetry. */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-custom",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Dashiell Russell",
    template: "%s",
  },
  description:
    "Mechatronics & physics student at UNSW — roboticist, rocket builder, and satellite engineer.",
  openGraph: {
    title: "Dashiell Russell",
    description: "Mechatronics & physics student at UNSW — roboticist, rocket builder, and satellite engineer.",
    type: "website",
    locale: "en_AU",
  },
  twitter: { card: "summary_large_image", title: "Dashiell Russell" },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The site is dark-only by design — the ASCII field and zone accents are
    // built for a dark ground and a light theme would undo both.
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <Preloader />
        <ZoneProvider initial="ascent">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </ZoneProvider>
        <Analytics />
      </body>
    </html>
  )
}
