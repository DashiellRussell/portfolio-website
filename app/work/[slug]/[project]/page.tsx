import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import type { Metadata } from "next"

import { experiences, getExperience } from "@/lib/content/experiences"
import type { Project } from "@/lib/content/types"
import { assetExists } from "@/lib/content/assets"
import { isPlaceholder } from "@/lib/content/audit"
import { AsciiField } from "@/components/space/ascii-field"
import { SatelliteDiagram } from "@/components/space/satellite-diagram"
import { ZoneSection } from "@/components/space/zone-section"
import { DrawRule } from "@/components/space/scroll"
import { Copy } from "@/components/space/copy"
import { ComingSoon } from "@/components/space/coming-soon"
import { DETAILS_LIVE } from "@/lib/content/flags"

const STATUS_LABEL: Record<Project["status"], string> = {
  flown: "Flown",
  "ground-tested": "Ground tested",
  "in-development": "In development",
  operational: "Operational",
  research: "Research",
  archived: "Archived",
}

export function generateStaticParams() {
  return experiences.flatMap((e) =>
    e.projects.map((p) => ({ slug: e.slug, project: p.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; project: string }>
}): Promise<Metadata> {
  const { slug, project: projectSlug } = await params
  const experience = getExperience(slug)
  const project = experience?.projects.find((p) => p.slug === projectSlug)
  if (!experience || !project) return {}

  const description = isPlaceholder(project.summary)
    ? `${project.name} — ${experience.name}.`
    : project.summary

  return { title: `${project.name} — ${experience.name}`, description }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string; project: string }>
}) {
  const { slug, project: projectSlug } = await params
  const experience = getExperience(slug)
  const project = experience?.projects.find((p) => p.slug === projectSlug)
  if (!experience || !project) notFound()
  if (!DETAILS_LIVE) return <ComingSoon experience={experience} project={project.name} />

  const hasImage = assetExists(project.image?.src)

  return (
    <>
      {/* ---------- Hero ---------- */}
      <ZoneSection
        zone={experience.zone}
        className="relative isolate flex min-h-[62svh] items-end overflow-hidden"
      >
        <div className="absolute inset-0 -z-10">
          {hasImage ? (
            <Image
              src={project.image!.src}
              alt={project.image!.alt}
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
                "linear-gradient(to top, var(--background) 6%, color-mix(in oklab, var(--background) 72%, transparent) 42%, transparent 84%)",
            }}
          />
        </div>

        <div className="container-page pb-14 pt-36">
          <Link
            href={`/work/${experience.slug}`}
            className="label mb-10 inline-flex items-center gap-2 transition-colors hover:text-[var(--accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {experience.name}
          </Link>

          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="label label-accent">{project.category}</span>
            <span
              className="label border px-2 py-0.5"
              style={{ borderColor: "var(--border-strong)" }}
            >
              {STATUS_LABEL[project.status]}
            </span>
          </div>

          <h1 className="display mb-6">{project.name}</h1>
          <Copy
            as="p"
            text={project.tagline}
            className="block max-w-2xl text-[length:var(--step-1)] leading-relaxed text-[var(--muted-foreground)]"
          />
        </div>
      </ZoneSection>

      {/* ---------- Spec bar ---------- */}
      {project.specs.length > 0 ? (
        <section
          className="border-y"
          style={{ borderColor: "var(--border)", background: "var(--surface-sunken)" }}
        >
          <div className="container-page grid sm:grid-cols-2 lg:grid-cols-4">
            {project.specs.map((spec) => (
              <div key={spec.label} className="py-8 pr-6">
                <p className="label mb-2">{spec.label}</p>
                <Copy
                  as="p"
                  text={spec.value}
                  className="block font-mono text-[length:var(--step-1)]"
                />
                {spec.note ? (
                  <p className="mt-1 text-[length:var(--step--1)] text-[var(--subtle)]">
                    {spec.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------- Summary + contributions ---------- */}
      <section className="container-page py-[var(--section-y)]">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="label label-accent mb-4">My contribution</p>
            <p className="label">{experience.name}</p>
          </div>

          <div>
            <Copy
              as="p"
              text={project.summary}
              className="mb-10 block text-[length:var(--step-1)] leading-relaxed"
            />
            <ul className="space-y-4">
              {project.contributions.map((c, i) => (
                <li key={i} className="flex gap-4">
                  <span className="label label-accent mt-1 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Copy
                    as="span"
                    text={c}
                    className="leading-relaxed text-[var(--muted-foreground)]"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Annotated diagram ---------- */}
      {project.diagram ? (
        <section
          className="border-y py-[var(--section-y)]"
          style={{ borderColor: "var(--border)", background: "var(--surface-sunken)" }}
        >
          <div className="container-page">
            <p className="label label-accent mb-4">Subsystems</p>
            <h2 className="headline mb-12 max-w-2xl">Where my work sits in the vehicle.</h2>
            <SatelliteDiagram callouts={project.diagram.callouts} />
          </div>
        </section>
      ) : null}

      {/* ---------- Long-form sections ---------- */}
      {project.sections.length > 0 ? (
        <section className="container-page py-[var(--section-y)]">
          <div className="max-w-3xl space-y-20">
            {project.sections.map((s) => (
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
                {s.image && assetExists(s.image.src) ? (
                  <figure className="mt-10">
                    <Image
                      src={s.image.src}
                      alt={s.image.alt}
                      width={1200}
                      height={800}
                      className="w-full border"
                      style={{ borderColor: "var(--border)" }}
                    />
                    {s.image.caption ? (
                      <figcaption className="label mt-3">{s.image.caption}</figcaption>
                    ) : null}
                  </figure>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------- Links ---------- */}
      {project.links && project.links.length > 0 ? (
        <section className="container-page pb-[var(--section-y)]">
          <DrawRule className="mb-8" />
          <div className="flex flex-wrap gap-4">
            {project.links.map((l) => (
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
