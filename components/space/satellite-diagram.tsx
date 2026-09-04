"use client"

import { useState } from "react"
import type { Callout } from "@/lib/content/types"

/**
 * Interactive annotated satellite schematic.
 *
 * Drawn as vector rather than shipped as an image so it stays crisp, follows
 * the live zone accent, and keeps the hotspots anchored to real geometry. If a
 * Blender render replaces the artwork later, only <Bus /> needs swapping — the
 * callout layer is geometry-independent and driven by data.
 */

/** Schematic viewBox. Callout x/y are percentages of this box. */
const VB = { w: 800, h: 520 }

function Bus({ activeId }: { activeId: string | null }) {
  // Parts light up when their callout is active.
  const lit = (id: string) => (activeId === id ? "var(--accent)" : "var(--border-strong)")
  const litFill = (id: string) =>
    activeId === id ? "color-mix(in oklab, var(--accent) 18%, transparent)" : "var(--surface-raised)"

  return (
    <g>
      {/* ---- Solar arrays ---- */}
      <g id="array-port">
        <rect x="40" y="180" width="230" height="150" fill={litFill("solar")} stroke={lit("solar")} strokeWidth="1.5" />
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={40 + (i + 1) * 33} y1="180" x2={40 + (i + 1) * 33} y2="330" stroke={lit("solar")} strokeWidth="0.75" opacity="0.5" />
        ))}
        <line x1="270" y1="255" x2="310" y2="255" stroke="var(--border-strong)" strokeWidth="2" />
      </g>
      <g id="array-stbd">
        <rect x="530" y="180" width="230" height="150" fill={litFill("solar")} stroke={lit("solar")} strokeWidth="1.5" />
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={530 + (i + 1) * 33} y1="180" x2={530 + (i + 1) * 33} y2="330" stroke={lit("solar")} strokeWidth="0.75" opacity="0.5" />
        ))}
        <line x1="490" y1="255" x2="530" y2="255" stroke="var(--border-strong)" strokeWidth="2" />
      </g>

      {/* ---- Main bus structure (3U-ish stack) ---- */}
      <rect x="310" y="150" width="180" height="210" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2" />

      {/* Stack rails */}
      <line x1="322" y1="150" x2="322" y2="360" stroke="var(--border)" strokeWidth="1" />
      <line x1="478" y1="150" x2="478" y2="360" stroke="var(--border)" strokeWidth="1" />

      {/* ---- Board stack: the MCU board is the hero part ---- */}
      <g id="board-adcs">
        <rect x="330" y="168" width="140" height="42" fill={litFill("adcs")} stroke={lit("adcs")} strokeWidth="1.25" />
        <circle cx="345" cy="189" r="4" fill={lit("adcs")} opacity="0.8" />
      </g>

      <g id="board-mcu">
        <rect x="330" y="222" width="140" height="52" fill={litFill("mcu")} stroke={lit("mcu")} strokeWidth="2" />
        {/* MCU die */}
        <rect x="378" y="238" width="44" height="24" fill="var(--background)" stroke={lit("mcu")} strokeWidth="1.5" />
        {/* Pin fan-out */}
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={i}>
            <line x1={378} y1={243 + i * 4} x2={366} y2={243 + i * 4} stroke={lit("mcu")} strokeWidth="0.75" />
            <line x1={422} y1={243 + i * 4} x2={434} y2={243 + i * 4} stroke={lit("mcu")} strokeWidth="0.75" />
          </g>
        ))}
        {/* Passives */}
        {Array.from({ length: 4 }).map((_, i) => (
          <rect key={i} x={340 + i * 8} y="228" width="4" height="7" fill={lit("mcu")} opacity="0.7" />
        ))}
      </g>

      <g id="board-eps">
        <rect x="330" y="286" width="140" height="42" fill={litFill("eps")} stroke={lit("eps")} strokeWidth="1.25" />
        <rect x="392" y="298" width="20" height="18" fill="none" stroke={lit("eps")} strokeWidth="1" />
      </g>

      {/* ---- Comms antenna ---- */}
      <g id="antenna">
        <line x1="400" y1="150" x2="400" y2="96" stroke={lit("comms")} strokeWidth="2" />
        <path d="M 360 96 Q 400 60 440 96" fill="none" stroke={lit("comms")} strokeWidth="2" />
        <circle cx="400" cy="88" r="4" fill={lit("comms")} />
      </g>

      {/* ---- Payload aperture ---- */}
      <g id="payload">
        <rect x="368" y="360" width="64" height="34" fill={litFill("payload")} stroke={lit("payload")} strokeWidth="1.5" />
        <circle cx="400" cy="377" r="11" fill="var(--background)" stroke={lit("payload")} strokeWidth="1.5" />
        <circle cx="400" cy="377" r="4" fill={lit("payload")} opacity="0.6" />
      </g>

      {/* Centreline + datum ticks — CAD detail */}
      <line x1="400" y1="40" x2="400" y2="470" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="6 6" opacity="0.5" />
      <line x1="20" y1="255" x2="780" y2="255" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="6 6" opacity="0.35" />
    </g>
  )
}

export function SatelliteDiagram({ callouts }: { callouts: Callout[] }) {
  const [active, setActive] = useState<string | null>(null)
  const activeCallout = callouts.find((c) => c.id === active) ?? null

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-center">
      <div className="relative">
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className="w-full"
          role="img"
          aria-label="Annotated satellite schematic. Interactive callouts mark contributed subsystems."
        >
          <Bus activeId={active} />
        </svg>

        {/* Hotspots, positioned as a percentage of the viewBox. */}
        {callouts.map((c) => {
          const on = active === c.id
          return (
            <button
              key={c.id}
              type="button"
              onMouseEnter={() => setActive(c.id)}
              onFocus={() => setActive(c.id)}
              onClick={() => setActive(on ? null : c.id)}
              aria-pressed={on}
              aria-label={c.title}
              className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
            >
              <span className="relative flex h-4 w-4 items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full border transition-all duration-300"
                  style={{
                    borderColor: "var(--accent)",
                    transform: on ? "scale(1.9)" : "scale(1)",
                    opacity: on ? 0.35 : 0.6,
                  }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full transition-transform duration-300"
                  style={{
                    background: "var(--accent)",
                    transform: on ? "scale(1.5)" : "scale(1)",
                  }}
                />
              </span>
            </button>
          )
        })}
      </div>

      {/* Readout panel. Reserves height so hovering doesn't reflow the page. */}
      <div className="panel ticked min-h-[11rem] p-6">
        {activeCallout ? (
          <>
            <p className="label label-accent mb-3">{activeCallout.id}</p>
            <h3 className="headline mb-3 text-[length:var(--step-1)]">{activeCallout.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{activeCallout.body}</p>
          </>
        ) : (
          <>
            <p className="label mb-3">Subsystem readout</p>
            <p className="text-muted-foreground leading-relaxed">
              Select a marked node on the schematic to inspect the subsystem and the
              specific contribution made to it.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
