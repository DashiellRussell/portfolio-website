"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { experiences } from "@/lib/content/experiences"

const ELSEWHERE = [
  { label: "GitHub", href: "https://github.com/DashiellRussell" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/dashiell-russell-9973482a1" },
  { label: "Instagram", href: "https://www.instagram.com/dashiell_russell/" },
  { label: "Résumé", href: "/Dashiell Russell - Resume.pdf" },
]

/**
 * Fixed header. Transparent over the hero, then resolves into a solid bar once
 * the reader is into the content so it never competes with the panels.
 *
 * Phones get a three-line menu button that opens a full-screen menu: the
 * cards, projects, contact, and the elsewhere links.
 */
export function SiteHeader() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // lock the page behind the menu, and let Escape close it
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const close = () => setOpen(false)
  const ease = [0.7, 0, 0.2, 1] as const

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-all duration-500"
        style={{
          background: solid && !open ? "color-mix(in oklab, var(--background) 82%, transparent)" : "transparent",
          backdropFilter: solid && !open ? "blur(14px)" : "none",
          borderBottom: `1px solid ${solid && !open ? "var(--border)" : "transparent"}`,
        }}
      >
        <div className="container-page flex h-16 items-center justify-between">
          <Link
            href="/"
            onClick={close}
            className="label whitespace-nowrap !font-bold !text-[var(--foreground)] !tracking-[0.16em] sm:!font-normal sm:!tracking-[0.22em]"
          >
            DASHIELL RUSSELL
          </Link>

          <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
            <Link href="/#work" className="label transition-colors hover:text-[var(--accent)]">
              Experience
            </Link>
            <Link href="/projects" className="label transition-colors hover:text-[var(--accent)]">
              Projects
            </Link>
            <Link href="/#contact" className="label transition-colors hover:text-[var(--accent)]">
              Contact
            </Link>
          </nav>

          {/* three lines that fold into an X */}
          <button
            type="button"
            className="relative -mr-2 flex h-10 w-10 items-center justify-center sm:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {[-6, 0, 6].map((y, i) => (
              <motion.span
                key={i}
                className="absolute h-[1.5px] w-6"
                style={{ background: "var(--foreground)" }}
                initial={false}
                animate={
                  open
                    ? i === 1
                      ? { opacity: 0, scaleX: 0.4 }
                      : { y: 0, rotate: i === 0 ? 45 : -45, opacity: 1 }
                    : { y, rotate: 0, opacity: 1, scaleX: 1 }
                }
                transition={{ duration: 0.3, ease }}
              />
            ))}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto sm:hidden"
            style={{ background: "var(--background)" }}
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.45, ease }}
          >
            <nav className="container-page flex flex-1 flex-col justify-center gap-10 pt-24 pb-10" aria-label="Menu">
              <div>
                <p className="label label-accent mb-4">Work</p>
                <ul className="grid gap-1">
                  {experiences.map((e, i) => (
                    <motion.li
                      key={e.slug}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease, delay: 0.12 + i * 0.05 }}
                    >
                      <Link
                        href={`/#${e.slug}`}
                        onClick={close}
                        className="block py-1 text-[length:var(--step-3)] font-bold uppercase leading-[1.05] tracking-tight"
                      >
                        {e.name}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <motion.ul
                className="grid gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <li>
                  <Link href="/projects" onClick={close} className="text-[length:var(--step-1)] font-medium">
                    All projects
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" onClick={close} className="text-[length:var(--step-1)] font-medium">
                    Contact
                  </Link>
                </li>
              </motion.ul>

              <motion.div
                className="flex flex-wrap gap-x-6 gap-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              >
                {ELSEWHERE.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="label hover:text-[var(--accent)]">
                    {l.label}
                  </a>
                ))}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
