import type { Metadata } from "next"

import { PANEL_VARIANTS, LIGHTING_VARIANTS } from "@/lib/satellite/panel-variants"
import { SatelliteRender } from "@/components/space/satellite-render"

export const metadata: Metadata = {
  title: "Panel lab",
  description: "Comparison sheet for solar array finish and lighting.",
  // Internal tool — should never surface in search.
  robots: { index: false, follow: false },
}

const DEFAULT_LIGHT = LIGHTING_VARIANTS[0]
const DEFAULT_PANEL = PANEL_VARIANTS[1]

/**
 * Internal comparison sheet for nailing the array finish.
 *
 * Not linked from the site. Every tile is a static single-frame render, so a
 * dozen of them cost about as much as one animated scene would.
 */
export default function PanelLab() {
  return (
    <div className="container-page pb-32 pt-40">
      <p className="label label-accent mb-4">Lab</p>
      <h1 className="display mb-6">Panel finish</h1>
      <p className="mb-4 max-w-2xl leading-relaxed text-[var(--muted-foreground)]">
        Anodised aluminium is a satin metallic — a coloured oxide over metal —
        so it sits between a mirror and a matte paint. Roughness is the dial
        that decides which it reads as: below about 0.1 it mirrors and the
        colour washes out; above about 0.45 it goes chalky and stops looking
        like metal. These bracket that range.
      </p>
      <p className="label mb-16">
        Pick one by id and I will apply it to the hero.
      </p>

      {/* ---------- Panel variants, close up ---------- */}
      <section className="mb-28">
        <h2 className="headline mb-2">Finish</h2>
        <p className="label mb-10">Same lighting ({DEFAULT_LIGHT.name}), close on the array</p>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {PANEL_VARIANTS.map((v) => (
            <figure key={v.id} className="panel ticked overflow-hidden">
              <div
                className="relative aspect-[4/3] w-full"
                style={{ background: "var(--surface-sunken)" }}
              >
                <SatelliteRender
                  panel={v}
                  lighting={DEFAULT_LIGHT}
                  closeUp
                  lasers={false}
                />
              </div>
              <figcaption className="border-t p-5" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="text-[length:var(--step-1)] font-medium">{v.name}</span>
                  <span className="label label-accent">{v.id}</span>
                </div>
                <p className="mb-3 text-[length:var(--step--1)] leading-relaxed text-[var(--muted-foreground)]">
                  {v.note}
                </p>
                <p className="label">
                  rough {v.roughness} · metal {v.metalness} · env {v.envMapIntensity}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- Lighting variants ---------- */}
      <section className="mb-28">
        <h2 className="headline mb-2">Lighting</h2>
        <p className="label mb-10">
          Same finish ({DEFAULT_PANEL.name}), full craft, with the site scrim applied
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {LIGHTING_VARIANTS.map((l) => (
            <figure key={l.id} className="panel ticked overflow-hidden">
              <div
                className="relative aspect-[16/10] w-full"
                style={{ background: "var(--surface-sunken)" }}
              >
                <SatelliteRender panel={DEFAULT_PANEL} lighting={l} />
                {/* The site lays a scrim over the hero for text legibility.
                    Previewing without it made picks look brighter here than
                    they render in place. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, var(--background) 0%, color-mix(in oklab, var(--background) 72%, transparent) 18%, transparent 46%)",
                  }}
                />
              </div>
              <figcaption className="border-t p-5" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="text-[length:var(--step-1)] font-medium">{l.name}</span>
                  <span className="label label-accent">{l.id}</span>
                </div>
                <p className="mb-3 text-[length:var(--step--1)] leading-relaxed text-[var(--muted-foreground)]">
                  {l.note}
                </p>
                <p className="label">exposure {l.exposure}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- Full matrix ---------- */}
      <section>
        <h2 className="headline mb-2">Matrix</h2>
        <p className="label mb-10">Every finish under every light</p>

        <div className="overflow-x-auto">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `8rem repeat(${LIGHTING_VARIANTS.length}, minmax(13rem, 1fr))`,
            }}
          >
            <div />
            {LIGHTING_VARIANTS.map((l) => (
              <div key={l.id} className="label label-accent pb-2">
                {l.name}
              </div>
            ))}

            {PANEL_VARIANTS.map((v) => (
              <FragmentRow key={v.id} id={v.id} name={v.name} variant={v} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function FragmentRow({
  id,
  name,
  variant,
}: {
  id: string
  name: string
  variant: (typeof PANEL_VARIANTS)[number]
}) {
  return (
    <>
      <div className="flex flex-col justify-center pr-3">
        <span className="text-[length:var(--step-0)] font-medium leading-tight">{name}</span>
        <span className="label">{id}</span>
      </div>
      {LIGHTING_VARIANTS.map((l) => (
        <div
          key={l.id}
          className="relative aspect-[4/3] border"
          style={{ background: "var(--surface-sunken)", borderColor: "var(--border)" }}
        >
          <SatelliteRender panel={variant} lighting={l} closeUp lasers={false} />
        </div>
      ))}
    </>
  )
}
