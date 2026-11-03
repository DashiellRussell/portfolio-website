"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { FileText, Github, Instagram, Linkedin } from "lucide-react"
import { experiences } from "@/lib/content/experiences"

const ELSEWHERE = [
  { label: "GitHub", href: "https://github.com/DashiellRussell", Icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/dashiell-russell-9973482a1", Icon: Linkedin },
  { label: "Instagram", href: "https://www.instagram.com/dashiell_russell/", Icon: Instagram },
  { label: "Résumé", href: "/Dashiell Russell - Resume.pdf", Icon: FileText },
]

/**
 * Fixed header. Transparent over the hero, then resolves into a solid bar once
 * the reader is into the content so it never competes with the panels.
 *
 * Desktop: Projects is a hover dropdown of the cards. Phones get a
 * three-line menu button that opens a full-screen menu with the same
 * structure, already expanded, plus the elsewhere links.
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
            {/* Projects: hover (or focus) opens the list of cards */}
            <div className="group/proj relative">
              <Link href="/projects" className="label inline-flex items-center gap-1.5 transition-colors hover:text-[var(--accent)]" aria-haspopup="true">
                Projects
                <span aria-hidden="true" className="inline-block text-[0.7em] transition-transform group-hover/proj:rotate-180 group-focus-within/proj:rotate-180">▾</span>
              </Link>
              <div className="invisible absolute right-0 top-full pt-3 opacity-0 transition-all duration-200 group-hover/proj:visible group-hover/proj:opacity-100 group-focus-within/proj:visible group-focus-within/proj:opacity-100">
                <ul
                  className="min-w-56 border py-2"
                  style={{ background: "color-mix(in oklab, var(--background) 94%, transparent)", borderColor: "var(--border)", backdropFilter: "blur(14px)" }}
                >
                  {experiences.map((e) => (
                    <li key={e.slug}>
                      <Link href={`/#${e.slug}`} className="block px-4 py-2 text-[length:var(--step--1)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-faint)] hover:text-[var(--foreground)]">
                        {e.name}
                      </Link>
                    </li>
                  ))}
                  <li className="mt-1 border-t pt-1" style={{ borderColor: "var(--border)" }}>
                    <Link href="/projects" className="block px-4 py-2 text-[length:var(--step--1)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent-faint)] hover:text-[var(--foreground)]">
                      All projects
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
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
              {/* top-level items share one size; the projects under them are smaller */}
              <ul className="grid gap-7">
                <motion.li initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay: 0.12 }}>
                  <Link href="/projects" onClick={close} className="block text-[length:var(--step-2)] font-semibold">
                    Projects
                  </Link>
                  <ul className="mt-3 grid gap-2 border-l pl-4" style={{ borderColor: "var(--border-strong)" }}>
                    {experiences.map((e, i) => (
                      <motion.li
                        key={e.slug}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, ease, delay: 0.18 + i * 0.04 }}
                      >
                        <Link href={`/#${e.slug}`} onClick={close} className="block py-0.5 text-[length:var(--step-0)] text-[var(--muted-foreground)]">
                          {e.name}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </motion.li>
                <motion.li initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay: 0.3 }}>
                  <Link href="/#contact" onClick={close} className="block text-[length:var(--step-2)] font-semibold">
                    Contact
                  </Link>
                </motion.li>
              </ul>

              <motion.div
                className="flex gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              >
                {ELSEWHERE.map(({ label, href, Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-12 w-12 items-center justify-center border text-[var(--muted-foreground)] transition-colors hover:text-[var(--accent)]"
                    style={{ borderColor: "var(--border-strong)" }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
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
