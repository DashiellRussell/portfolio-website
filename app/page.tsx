import { Hero } from "@/components/space/hero"
import { ExperiencePanel } from "@/components/space/experience-panel"
import { ContactSection } from "@/components/space/contact-section"
import { experiences } from "@/lib/content/experiences"
import { assertContentComplete } from "@/lib/content/audit"

export default function Home() {
  // Surfaces unfilled copy during development; fails a production build.
  assertContentComplete()

  return (
    <>
      <Hero />

      <div id="work">
        {experiences.map((experience, i) => (
          <ExperiencePanel key={experience.slug} experience={experience} index={i} />
        ))}
      </div>

      <ContactSection />
    </>
  )
}
