"use client"

import { useRef, type ReactNode } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

/**
 * Scroll motion primitives.
 *
 * All easing runs through one curve so the whole site accelerates and settles
 * the same way. Springs are used for scrubbed values (they trail the wheel and
 * settle) and the bezier for discrete reveals.
 */

/** Slow out, hard settle. Shared by every discrete reveal on the site. */
const EASE = [0.16, 0.84, 0.24, 1] as const

const SPRING = { stiffness: 55, damping: 24, mass: 0.7 }

/** Fades and lifts content in as it enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className = "",
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Vertical parallax tied to the element's own travel through the viewport.
 * `strength` is in pixels of counter-movement across the full pass.
 */
export function Parallax({
  children,
  strength = 90,
  className = "",
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const eased = useSpring(scrollYProgress, SPRING)
  const y = useTransform(eased, [0, 1], [strength, -strength])

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  )
}

/**
 * Scrubbed scale — used behind the product panels so imagery drifts closer as
 * it passes, giving the stack depth without a hover dependency.
 */
export function ScrubScale({
  children,
  from = 1.12,
  to = 1,
  className = "",
}: {
  children: ReactNode
  from?: number
  to?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  })
  const eased = useSpring(scrollYProgress, SPRING)
  const scale = useTransform(eased, [0, 1], [from, to])

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  )
}

/** A hairline that draws itself in as it enters view. */
export function DrawRule({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`h-px origin-left ${className}`}
      style={{ background: "var(--border-strong)" }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, ease: EASE }}
    />
  )
}
