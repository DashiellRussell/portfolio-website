"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"

/**
 * Primary call to action: a solid block that inverts on hover.
 *
 * The accent panel wipes in from the left while the label and arrow slide
 * right, so the whole control resolves in one direction rather than just
 * changing colour. Everything runs on transform/opacity to stay off the
 * main thread.
 */
export function Cta({
  href,
  children,
  external = false,
  variant = "solid",
  className = "",
}: {
  href: string
  children: ReactNode
  external?: boolean
  /** `solid` for the primary action, `outline` for secondary ones. */
  variant?: "solid" | "outline"
  className?: string
}) {
  const solid = variant === "solid"

  const inner = (
    <span
      className={[
        "group/cta relative inline-flex items-center gap-3 overflow-hidden px-7 py-4",
        "transition-colors duration-300",
        className,
      ].join(" ")}
      style={{
        background: solid ? "var(--foreground)" : "transparent",
        border: `1px solid ${solid ? "var(--foreground)" : "var(--border-strong)"}`,
      }}
    >
      {/* Wipe layer. Scales from the left edge on hover. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 origin-left scale-x-0 transition-transform duration-[450ms] ease-[cubic-bezier(0.16,0.84,0.24,1)] group-hover/cta:scale-x-100"
        style={{ background: "var(--accent)" }}
      />

      {/* Solid starts inverted (dark on white); outline starts light. Both end
          dark once the accent wipe lands behind them. */}
      <span
        className={[
          "relative font-mono uppercase transition-all duration-[450ms]",
          "ease-[cubic-bezier(0.16,0.84,0.24,1)] group-hover/cta:translate-x-1",
          "group-hover/cta:text-[var(--accent-foreground)]",
          solid ? "text-[var(--primary-foreground)]" : "text-[var(--foreground)]",
        ].join(" ")}
        style={{ fontSize: "var(--step--1)", letterSpacing: "0.18em" }}
      >
        {children}
      </span>

      <ArrowRight
        aria-hidden="true"
        className={[
          "relative h-4 w-4 transition-all duration-[450ms]",
          "ease-[cubic-bezier(0.16,0.84,0.24,1)] group-hover/cta:translate-x-1.5",
          "group-hover/cta:text-[var(--accent-foreground)]",
          solid ? "text-[var(--primary-foreground)]" : "text-[var(--foreground)]",
        ].join(" ")}
      />
    </span>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
        {inner}
      </a>
    )
  }

  return (
    <Link href={href} className="inline-block">
      {inner}
    </Link>
  )
}
