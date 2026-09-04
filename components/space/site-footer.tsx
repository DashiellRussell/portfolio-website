import { ZoneSection } from "./zone-section"

const LINKS = [
  { label: "GitHub", href: "https://github.com/DashiellRussell" },
  { label: "Email", href: "mailto:dashiell.russell@gmail.com" },
  { label: "Résumé", href: "/Dashiell Russell - Resume.pdf" },
]

export function SiteFooter() {
  return (
    <ZoneSection
      zone="ground"
      id="contact"
      className="border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="container-page py-[var(--section-y)]">
        <p className="label label-accent mb-6">Contact</p>
        <h2 className="headline mb-12 max-w-2xl">
          Open to work on spacecraft electronics, avionics, and embedded systems.
        </h2>

        <div className="flex flex-wrap gap-4">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="border px-6 py-3 transition-colors hover:border-[var(--accent-dim)]"
              style={{ borderColor: "var(--border-strong)" }}
            >
              <span className="label hover:text-[var(--accent)]">{l.label}</span>
            </a>
          ))}
        </div>

        <div className="rule mt-20 mb-6" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="label">Dashiell Russell — Sydney, Australia</span>
          <span className="label">{new Date().getFullYear()}</span>
        </div>
      </div>
    </ZoneSection>
  )
}
