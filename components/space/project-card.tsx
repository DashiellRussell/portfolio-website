import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Project } from "@/lib/content/types"
import { assetExists } from "@/lib/content/assets"
import { Copy } from "./copy"

const STATUS_LABEL: Record<Project["status"], string> = {
  flown: "Flown",
  "ground-tested": "Ground tested",
  "in-development": "In development",
  operational: "Operational",
  research: "Research",
  archived: "Archived",
}

/**
 * Large project card.
 *
 * Sized to be the dominant element on the page rather than a thumbnail in a
 * grid — a project deserves a panel, not a tile. Missing artwork degrades to a
 * ruled placeholder instead of a broken image.
 */
export function ProjectCard({
  project,
  experienceSlug,
  experienceName,
  index,
}: {
  project: Project
  experienceSlug: string
  experienceName?: string
  index?: number
}) {
  const hasImage = assetExists(project.image?.src)

  return (
    <Link
      href={`/work/${experienceSlug}/${project.slug}`}
      className="group block focus:outline-none"
    >
      <article
        className="panel ticked relative overflow-hidden transition-colors duration-500 group-hover:border-[var(--accent-dim)] group-focus-visible:border-[var(--accent)]"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          {/* ---- Visual ---- */}
          <div className="relative min-h-[15rem] overflow-hidden md:min-h-[19rem]">
            {hasImage ? (
              <Image
                src={project.image!.src}
                alt={project.image!.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "var(--surface-sunken)" }}
              >
                {/* Ruled placeholder — deliberate, not a broken asset. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.5]"
                  style={{
                    backgroundImage:
                      "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                    backgroundSize: "34px 34px",
                  }}
                />
                <span className="label relative">{project.category}</span>
              </div>
            )}
          </div>

          {/* ---- Body ---- */}
          <div className="flex flex-col justify-between gap-8 p-7 md:p-9">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                {typeof index === "number" ? (
                  <span className="label label-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                ) : null}
                {experienceName ? <span className="label">{experienceName}</span> : null}
                <span
                  className="label border px-2 py-0.5"
                  style={{ borderColor: "var(--border-strong)" }}
                >
                  {STATUS_LABEL[project.status]}
                </span>
              </div>

              <h3 className="headline mb-4 text-[length:var(--step-2)]">{project.name}</h3>

              <Copy
                as="p"
                text={project.tagline}
                className="block leading-relaxed text-[var(--muted-foreground)]"
              />
            </div>

            <span className="inline-flex items-center gap-3">
              <span className="label transition-colors group-hover:text-[var(--accent)]">
                Read more
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 text-[var(--muted-foreground)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--accent)]"
              />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
