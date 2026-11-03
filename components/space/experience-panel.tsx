import Image from "next/image"
import type { Experience } from "@/lib/content/types"
import { assetExists } from "@/lib/content/assets"
import { roleRange } from "@/lib/content/experiences"
import { AsciiField } from "./ascii-field"
import { SatelliteScene } from "./satellite-scene"
import { RocketPlume } from "@/components/3d/rocket-plume"
import { RoboticsBench } from "@/components/3d/robotics-bench"
import { RocketRange } from "@/components/3d/rocket-range"
import { RamsocScreens } from "@/components/3d/ramsoc-screens"
import { OnScreen } from "./on-screen"
import { DETAILS_LIVE } from "@/lib/content/flags"
import { Copy } from "./copy"
import { Cta } from "./cta"
import { Reveal, ScrubScale } from "./scroll"
import { ZoneSection } from "./zone-section"

/**
 * A full-bleed panel for one organisation.
 *
 * Leads with where the work happened and the role held there — the projects
 * live one level down. Every live visual sits in `OnScreen`, so only the panels
 * near the viewport hold a canvas at all. Minimal text by design: the panel's job is to make the
 * reader open the page, not to summarise it.
 */
export function ExperiencePanel({
  experience,
  index,
}: {
  experience: Experience
  index: number
}) {
  const hasImage = assetExists(experience.hero?.src)
  const current = experience.roles[0]

  return (
    <ZoneSection
      zone={experience.zone}
      id={experience.slug}
      className="group relative isolate flex min-h-[100svh] items-end overflow-hidden border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="absolute inset-0 -z-10">
        {experience.visual === "satellite" ? (
          <div className="relative h-full w-full bg-[var(--surface-sunken)]">
            <OnScreen>
              <SatelliteScene />
            </OnScreen>
          </div>
        ) : experience.visual === "plume" ? (
          <div className="relative h-full w-full bg-[var(--surface-sunken)]">
            <OnScreen>
              <RocketPlume zoom={1.9} />
            </OnScreen>
          </div>
        ) : experience.visual === "nozzle" ? (
          <div className="relative h-full w-full bg-[var(--surface-sunken)]">
            <OnScreen>
              <RocketRange />
            </OnScreen>
          </div>
        ) : experience.visual === "ramsoc" ? (
          <div className="relative h-full w-full bg-[var(--surface-sunken)]">
            <OnScreen>
              <RamsocScreens />
            </OnScreen>
          </div>
        ) : experience.visual === "robotics" ? (
          <div className="relative h-full w-full bg-[var(--surface-sunken)]">
            <OnScreen>
              <RoboticsBench />
            </OnScreen>
          </div>
        ) : hasImage ? (
          <ScrubScale className="h-full w-full overflow-hidden">
            <div className="relative h-full w-full">
              <Image
                src={experience.hero!.src}
                alt={experience.hero!.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </ScrubScale>
        ) : (
          <div className="relative h-full w-full bg-[var(--surface-sunken)]">
            <OnScreen>
              <AsciiField />
            </OnScreen>
          </div>
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              experience.visual === "satellite" ||
              experience.visual === "plume" ||
              experience.visual === "nozzle" ||
              experience.visual === "robotics" ||
              experience.visual === "ramsoc"
                ? "linear-gradient(to top, var(--background) 0%, color-mix(in oklab, var(--background) 70%, transparent) 16%, transparent 44%)"
                : "linear-gradient(to top, var(--background) 4%, color-mix(in oklab, var(--background) 66%, transparent) 38%, transparent 82%)",
          }}
        />
      </div>

      <div className="container-page w-full pb-[clamp(3rem,7vw,6rem)] pt-[clamp(6rem,14vw,12rem)]">
        <div className="max-w-2xl">
          <Reveal delay={0.06}>
            <h2 className="display mb-5" style={{ fontWeight: 700 }}>
              {experience.name}
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            {current ? (
              <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Copy
                  as="span"
                  text={current.title}
                  className="text-[length:var(--step-1)] font-medium"
                />
                <span className="label">{roleRange(current)}</span>
              </div>
            ) : null}

            <Copy
              as="p"
              text={experience.tagline}
              className="mb-9 block max-w-xl leading-relaxed text-[var(--muted-foreground)]"
            />
          </Reveal>

          <Reveal delay={0.18}>
            {DETAILS_LIVE ? (
              <Cta href={`/work/${experience.slug}`}>Read more</Cta>
            ) : (
              <span
                className="label inline-flex items-center gap-3 border px-7 py-4"
                style={{ borderColor: "var(--border-strong)" }}
              >
                Details coming soon
              </span>
            )}
          </Reveal>
        </div>
      </div>
    </ZoneSection>
  )
}
