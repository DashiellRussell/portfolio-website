import { Hero } from "@/components/space/hero"
import { ExperiencePanel } from "@/components/space/experience-panel"
import { ZoneSection } from "@/components/space/zone-section"
import { Cta } from "@/components/space/cta"
import { Reveal, DrawRule } from "@/components/space/scroll"
import { experiences } from "@/lib/content/experiences"
import { assertContentComplete } from "@/lib/content/audit"

export default function Home() {
  // Surfaces unfilled copy during development; fails a production build.
  assertContentComplete()

  const projectCount = experiences.reduce((n, e) => n + e.projects.length, 0)

  return (
    <>
      <Hero />

      <ZoneSection zone="orbit" id="work" className="container-page py-[var(--section-y)]">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label label-accent mb-4">Experience</p>
              <h2 className="headline max-w-xl">
                Where I have worked, and what I built there.
              </h2>
            </div>
            <p className="label">
              {String(experiences.length).padStart(2, "0")} organisations ·{" "}
              {String(projectCount).padStart(2, "0")} projects
            </p>
          </div>
        </Reveal>
        <DrawRule className="mt-10" />
      </ZoneSection>

      {experiences.map((experience, i) => (
        <ExperiencePanel key={experience.slug} experience={experience} index={i} />
      ))}

      {/* Closing call to action. The one place on the page asking for something. */}
      <ZoneSection zone="ground" className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="container-page py-[var(--section-y)]">
          <Reveal>
            <p className="label label-accent mb-5">What next</p>
            <h2 className="headline mb-8 max-w-2xl">
              I am looking for work in spacecraft electronics, avionics, and
              embedded systems.
            </h2>
            <p className="mb-12 max-w-xl leading-relaxed text-[var(--muted-foreground)]">
              If you are building hardware that has to survive launch — or the
              software that flies it — I would like to hear about it.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-wrap items-center gap-4">
              <Cta href="mailto:dashiell.russell@gmail.com" external>
                Get in touch
              </Cta>
              <Cta href="/Dashiell Russell - Resume.pdf" external variant="outline">
                Résumé
              </Cta>
            </div>
          </Reveal>
        </div>
      </ZoneSection>
    </>
  )
}
