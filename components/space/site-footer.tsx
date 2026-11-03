import Link from "next/link"
import { experiences } from "@/lib/content/experiences"

const ELSEWHERE = [
  { label: "GitHub", href: "https://github.com/DashiellRussell" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/dashiell-russell-9973482a1" },
  { label: "Instagram", href: "https://www.instagram.com/dashiell_russell/" },
  { label: "Email", href: "mailto:dashiell.russell@gmail.com" },
  { label: "Résumé", href: "/Dashiell Russell - Resume.pdf" },
]

/** Site footer: who, where the work is, what I am doing now, and where else to find me. */
export function SiteFooter() {
  // current positions, straight from the content model
  const now = experiences
    .map((e) => ({ org: e.name, role: e.roles.find((r) => r.end === null) }))
    .filter((x) => x.role && !x.role.title.startsWith("TODO"))

  const external = (href: string) => href.startsWith("http") || href.endsWith(".pdf")

  return (
    <footer className="border-t" style={{ borderColor: "var(--border)" }}>
      <div className="container-page grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
        <div>
          <p className="mb-3 text-[length:var(--step-1)] font-semibold uppercase tracking-tight">Dashiell Russell</p>
          <p className="mb-4 max-w-xs leading-relaxed text-[var(--muted-foreground)]">
            Mechatronics engineering and physics at UNSW. Spacecraft electronics, avionics, and robotics.
          </p>
          <p className="label" style={{ fontSize: "var(--step-0)", letterSpacing: "0.16em" }}>Sydney, Australia</p>
        </div>

        <nav aria-label="Work">
          <p className="label label-accent mb-4">Work</p>
          <ul className="grid gap-2.5">
            {experiences.map((e) => (
              <li key={e.slug}>
                <Link href={`/#${e.slug}`} className="hover:text-[var(--accent)]">{e.name}</Link>
              </li>
            ))}
            <li>
              <Link href="/projects" className="hover:text-[var(--accent)]">All projects</Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="label label-accent mb-4">Now</p>
          <ul className="grid gap-3">
            {now.map((n) => (
              <li key={n.org}>
                <span className="block">{n.role!.title}</span>
                <span className="label">{n.org}</span>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Elsewhere">
          <p className="label label-accent mb-4">Elsewhere</p>
          <ul className="grid gap-2.5">
            {ELSEWHERE.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target={external(l.href) ? "_blank" : undefined}
                  rel={external(l.href) ? "noopener noreferrer" : undefined}
                  className="hover:text-[var(--accent)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="container-page">
        <div className="rule" />
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6" style={{ paddingBottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}>
          <span className="label">© {new Date().getFullYear()} Dashiell Russell</span>
          <a href="#top" className="label hover:text-[var(--accent)]">Back to top ↑</a>
        </div>
      </div>
    </footer>
  )
}
