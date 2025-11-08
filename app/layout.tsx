import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://dashiellrussell.com'), // Update this to your actual domain
  title: {
    default: "Dashiell Russell | Mechatronics Engineer & Full-Stack Developer",
    template: "%s | Dashiell Russell"
  },
  description: "Mechatronics Engineering student specializing in robotics, PCB design, embedded systems, and full-stack web development. Building innovative solutions at the intersection of hardware and software.",
  keywords: [
    "Mechatronics Engineering",
    "Robotics",
    "PCB Design",
    "Embedded Systems",
    "Full-Stack Developer",
    "React",
    "Next.js",
    "Arduino",
    "IoT",
    "Circuit Design",
    "Hardware Engineering",
    "Software Development"
  ],
  authors: [{ name: "Dashiell Russell", url: "https://dashiellrussell.com" }],
  creator: "Dashiell Russell",
  publisher: "Dashiell Russell",

  // Icons are automatically generated from app/icon.tsx and app/apple-icon.tsx

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dashiellrussell.com',
    title: 'Dashiell Russell | Mechatronics Engineer & Full-Stack Developer',
    description: 'Building innovative solutions at the intersection of hardware and software. Specializing in robotics, PCB design, embedded systems, and web development.',
    siteName: 'Dashiell Russell Portfolio',
    // OG image is automatically generated from app/opengraph-image.tsx
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Dashiell Russell | Mechatronics Engineer & Full-Stack Developer',
    description: 'Building innovative solutions at the intersection of hardware and software. Robotics • PCB Design • Web Development',
    // Twitter image is automatically shared from opengraph-image.tsx
    creator: '@dashiell_russell', // Update with your Twitter handle if you have one
  },

  // Other
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add these when you have them)
  // verification: {
  //   google: 'your-google-verification-code',
  //   yandex: 'your-yandex-verification-code',
  // },

  // Manifest
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider defaultTheme="dark" storageKey="dashiell-theme">
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
