import type { Metadata } from "next"

import { experiences } from "@/lib/content/experiences"
import { ProjectCard } from "@/components/space/project-card"
import { ZoneSection } from "@/components/space/zone-section"
import { Reveal, DrawRule } from "@/components/space/scroll"
import { assertContentComplete } from "@/lib/content/audit"
import { DETAILS_LIVE } from "@/lib/content/flags"
import { ProjectsComingSoon } from "@/components/space/coming-soon"

export const metadata: Metadata = {
  title: "Projects · Dashiell Russell",
  description:
    "Every project, across spacecraft electronics, rocket avionics, robotics, and embedded software.",
}

export default function ProjectsPage() {
  assertContentComplete()
  if (!DETAILS_LIVE) return <ProjectsComingSoon experiences={experiences} />

  // Flatten every project, keeping the organisation it belongs to. Experience
  // order carries through, so the space work leads here too.
  const all = experiences.flatMap((e) =>
    e.projects.map((project) => ({
      project,
      experienceSlug: e.slug,
      experienceName: e.name,
    }))
  )

  return (
    <ZoneSection zone="orbit" className="container-page pb-[var(--section-y)] pt-40">
      <Reveal>
        <p className="label label-accent mb-4">Index</p>
        <h1 className="display mb-8">Projects</h1>
        <p className="mb-2 max-w-xl leading-relaxed text-[var(--muted-foreground)]">
          Everything, in one list: spacecraft electronics, rocket avionics,
          robotics, and the software that runs on them.
        </p>
        <p className="label">{String(all.length).padStart(2, "0")} total</p>
      </Reveal>

      <DrawRule className="mb-14 mt-10" />

      <div className="space-y-10">
        {all.map(({ project, experienceSlug, experienceName }, i) => (
          <Reveal key={`${experienceSlug}-${project.slug}`} delay={(i % 3) * 0.05}>
            <ProjectCard
              project={project}
              experienceSlug={experienceSlug}
              experienceName={experienceName}
              index={i}
            />
          </Reveal>
        ))}
      </div>
    </ZoneSection>
  )
}
