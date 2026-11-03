import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Experience } from "@/lib/content/types"
import { roleRange } from "@/lib/content/experiences"
import { ZoneSection } from "./zone-section"
import { Reveal } from "./scroll"

/** Holding page for a /work route while `DETAILS_LIVE` is off. */
export function ComingSoon({ experience, project }: { experience: Experience; project?: string }) {
  const current = experience.roles[0]
  return (
    <ZoneSection zone={experience.zone} className="flex min-h-[80svh] items-end">
      <div className="container-page w-full pb-[clamp(3rem,7vw,6rem)] pt-[clamp(8rem,16vw,14rem)]">
        <Reveal>
          <p className="label label-accent mb-5">Details coming soon</p>
          <h1 className="display mb-6" style={{ fontWeight: 700 }}>
            {project ?? experience.name}
          </h1>
          {current ? (
            <p className="mb-4 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[length:var(--step-1)] font-medium">{current.title}</span>
              <span className="label">{roleRange(current)}</span>
            </p>
          ) : null}
          <p className="mb-10 max-w-xl leading-relaxed text-[var(--muted-foreground)]">
            The full write-up for this work is being put together. In the meantime, get in touch
            if you would like to hear about it.
          </p>
          <div className="flex flex-wrap gap-6">
            <Link href="/#work" className="label inline-flex items-center gap-2 hover:text-[var(--accent)]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to the work
            </Link>
            <Link href="/#contact" className="label hover:text-[var(--accent)]">
              Get in touch
            </Link>
          </div>
        </Reveal>
      </div>
    </ZoneSection>
  )
}

/** Holding page for /projects while `DETAILS_LIVE` is off: points back to the cards. */
export function ProjectsComingSoon({ experiences }: { experiences: Experience[] }) {
  return (
    <ZoneSection zone="orbit" className="flex min-h-[80svh] items-end">
      <div className="container-page w-full pb-[clamp(3rem,7vw,6rem)] pt-[clamp(8rem,16vw,14rem)]">
        <Reveal>
          <p className="label label-accent mb-5">Details coming soon</p>
          <h1 className="display mb-6" style={{ fontWeight: 700 }}>Projects</h1>
          <p className="mb-10 max-w-xl leading-relaxed text-[var(--muted-foreground)]">
            The full project write-ups are being put together. For now, the work is on the home page.
          </p>
          <ul className="mb-10 grid gap-2">
            {experiences.map((e) => (
              <li key={e.slug}>
                <Link href={`/#${e.slug}`} className="text-[length:var(--step-1)] hover:text-[var(--accent)]">
                  {e.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/#contact" className="label hover:text-[var(--accent)]">Get in touch</Link>
        </Reveal>
      </div>
    </ZoneSection>
  )
}
