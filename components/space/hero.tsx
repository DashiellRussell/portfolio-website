"use client"

import Link from "next/link"
import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion"

import { Cta } from "./cta"
import { AsciiField } from "./ascii-field"
import { Ascii3D } from "./ascii-3d"
import { ZoneSection } from "./zone-section"

/**
 * Opening frame. A 3D rocket rendered entirely as ASCII, scrubbed by scroll.
 *
 * Two layers: the noise field behind for atmosphere, the vehicle in front.
 * Type is deliberately sparse so the render carries the frame.
 */
export function Hero() {
  const ref = useRef<HTMLElement | null>(null)
  // The canvas reads this every frame, so scroll never triggers a React render.
  const progressRef = useRef(0)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  // Spring the raw scroll value so the rocket's roll eases instead of tracking
  // the wheel one-to-one. This is the "curve" rather than a linear scrub.
  const eased = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 0.6 })

  useMotionValueEvent(eased, "change", (v) => {
    progressRef.current = v
  })

  const textY = useTransform(eased, [0, 1], [0, -110])
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const rocketScale = useTransform(eased, [0, 1], [1, 1.22])

  return (
    <ZoneSection
      zone="ascent"
      id="top"
      className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden"
      sectionRef={ref}
    >
      <div className="absolute inset-0 -z-10">
        <AsciiField />

        <motion.div style={{ scale: rocketScale }} className="absolute inset-0">
          <Ascii3D progressRef={progressRef} />
        </motion.div>

        {/* Lighter than a flat scrim: keeps the ASCII readable while still
            protecting the headline. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 78% 58% at 50% 45%, transparent 0%, color-mix(in oklab, var(--background) 55%, transparent) 68%, color-mix(in oklab, var(--background) 92%, transparent) 100%)",
          }}
        />
      </div>

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="container-page flex flex-1 items-center pt-32"
      >
        <div className="max-w-4xl">
          <p className="label label-accent mb-8">
            Mechatronics engineering and physics — UNSW
          </p>

          <h1 className="display mb-8">
            Dashiell
            <br />
            Russell
          </h1>

          <p className="mb-11 max-w-xl text-[length:var(--step-1)] leading-relaxed text-[var(--muted-foreground)]">
            Avionics, spacecraft electronics, and the software that runs on them.
            Hardware that has to work the first time.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Cta href="#work">View the work</Cta>
            <Cta href="mailto:dashiell.russell@gmail.com" external variant="outline">
              Get in touch
            </Cta>
          </div>
        </div>
      </motion.div>

      <motion.div style={{ opacity: textOpacity }} className="container-page pb-10">
        <div className="rule mb-6" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="#work" className="label transition-colors hover:text-[var(--accent)]">
            Selected work ↓
          </Link>
          <span className="label">Sydney, Australia</span>
        </div>
      </motion.div>
    </ZoneSection>
  )
}
