import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import type { Metadata } from "next"

import { experiences, getExperience, roleRange } from "@/lib/content/experiences"
import { assetExists } from "@/lib/content/assets"
import { isPlaceholder } from "@/lib/content/audit"
import { AsciiField } from "@/components/space/ascii-field"
import { SatelliteScene } from "@/components/space/satellite-scene"
import { RoleTimeline } from "@/components/space/role-timeline"
import { ProjectCard } from "@/components/space/project-card"
import { ZoneSection } from "@/components/space/zone-section"
import { Reveal, DrawRule } from "@/components/space/scroll"
import { Copy } from "@/components/space/copy"
import { ComingSoon } from "@/components/space/coming-soon"
import { DETAILS_LIVE } from "@/lib/content/flags"

export function generateStaticParams() {
  return experiences.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const experience = getExperience(slug)
  if (!experience) return {}

  // Never leak placeholder text into search results or link previews.
  const description = isPlaceholder(experience.summary)
    ? `${experience.name} — ${experience.roles[0]?.title ?? "Experience"}.`
    : experience.summary

  return { title: `${experience.name} — Dashiell Russell`, description }
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const experience = getExperience(slug)
  if (!experience) notFound()
  if (!DETAILS_LIVE) return <ComingSoon experience={experience} />

  const hasHero = assetExists(experience.hero?.src)
  const current = experience.roles[0]

  return (
    <>
      {/* ---------- Hero ---------- */}
      <ZoneSection
        zone={experience.zone}
        className="relative isolate flex min-h-[78svh] items-end overflow-hidden"
      >
        <div className="absolute inset-0 -z-10">
          {experience.visual === "satellite" ? (
            <div className="relative h-full w-full bg-[var(--surface-sunken)]">
              <SatelliteScene />
            </div>
          ) : hasHero ? (
            <Image
              src={experience.hero!.src}
              alt={experience.hero!.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="relative h-full w-full bg-[var(--surface-sunken)]">
              <AsciiField />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                experience.visual === "satellite"
                  ? "linear-gradient(to top, var(--background) 0%, color-mix(in oklab, var(--background) 72%, transparent) 18%, transparent 46%)"
                  : "linear-gradient(to top, var(--background) 6%, color-mix(in oklab, var(--background) 70%, transparent) 42%, transparent 84%)",
            }}
          />
        </div>

        <div className="container-page pb-16 pt-36">
          <Link
            href="/#work"
            className="label mb-10 inline-flex items-center gap-2 transition-colors hover:text-[var(--accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All experience
          </Link>

          <h1 className="display mb-6">{experience.name}</h1>

          {current ? (
            <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
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
            className="block max-w-2xl leading-relaxed text-[var(--muted-foreground)]"
          />
        </div>
      </ZoneSection>

      {/* ---------- Summary + role progression ---------- */}
      <section className="container-page py-[var(--section-y)]">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="label label-accent mb-5">Overview</p>
            <Copy
              as="p"
              text={experience.summary}
              className="block text-[length:var(--step-1)] leading-relaxed"
            />
          </div>

          <div>
            <p className="label label-accent mb-8">Roles</p>
            <RoleTimeline roles={experience.roles} />
          </div>
        </div>
      </section>

      {/* ---------- Projects ---------- */}
      {experience.projects.length > 0 ? (
        <section
          className="border-t py-[var(--section-y)]"
          style={{ borderColor: "var(--border)", background: "var(--surface-sunken)" }}
        >
          <div className="container-page">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="label label-accent mb-4">Projects</p>
                  <h2 className="headline max-w-xl">What I worked on here.</h2>
                </div>
                <p className="label">
                  {String(experience.projects.length).padStart(2, "0")}
                </p>
              </div>
            </Reveal>
            <DrawRule className="mb-14 mt-10" />

            <div className="space-y-10">
              {experience.projects.map((project, i) => (
                <Reveal key={project.slug} delay={i * 0.05}>
                  <ProjectCard
                    project={project}
                    experienceSlug={experience.slug}
                    index={i}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- Long-form sections ---------- */}
      {experience.sections.length > 0 ? (
        <section className="container-page py-[var(--section-y)]">
          <div className="max-w-3xl space-y-20">
            {experience.sections.map((s) => (
              <article key={s.heading}>
                <h2 className="headline mb-6">{s.heading}</h2>
                <div className="space-y-5">
                  {s.body.map((para, i) => (
                    <Copy
                      key={i}
                      as="p"
                      text={para}
                      className="block leading-relaxed text-[var(--muted-foreground)]"
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------- Links ---------- */}
      {experience.links && experience.links.length > 0 ? (
        <section className="container-page pb-[var(--section-y)]">
          <DrawRule className="mb-8" />
          <div className="flex flex-wrap gap-4">
            {experience.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 border px-5 py-3 transition-colors"
                style={{ borderColor: "var(--border-strong)" }}
              >
                <span className="label group-hover:text-[var(--accent)]">{l.label}</span>
                <ArrowUpRight
                  className="h-3.5 w-3.5 text-[var(--muted-foreground)]"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
