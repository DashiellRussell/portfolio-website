"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { experiences } from "@/lib/content/experiences"

/**
 * Fixed header. Transparent over the hero, then resolves into a solid bar once
 * the reader is into the content so it never competes with the panels.
 */
export function SiteHeader() {
  const [solid, setSolid] = useState(false)
  const projectCount = experiences.reduce((n, e) => n + e.projects.length, 0)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-500"
      style={{
        background: solid
          ? "color-mix(in oklab, var(--background) 82%, transparent)"
          : "transparent",
        backdropFilter: solid ? "blur(14px)" : "none",
        borderBottom: `1px solid ${solid ? "var(--border)" : "transparent"}`,
      }}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="label !text-[var(--foreground)] !tracking-[0.22em]">
          D. RUSSELL
        </Link>

        <nav className="flex items-center gap-6" aria-label="Primary">
          <Link href="/#work" className="label transition-colors hover:text-[var(--accent)]">
            Experience
          </Link>
          <Link href="/projects" className="label transition-colors hover:text-[var(--accent)]">
            Projects
          </Link>
          <Link href="/#contact" className="label transition-colors hover:text-[var(--accent)]">
            Contact
          </Link>
          <span
            className="hidden h-3 w-px sm:block"
            style={{ background: "var(--border-strong)" }}
            aria-hidden="true"
          />
          <span className="label hidden sm:inline">
            {String(projectCount).padStart(2, "0")}
          </span>
        </nav>
      </div>
    </header>
  )
}
