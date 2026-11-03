"use client"

import { useState } from "react"
import { ArrowRight, Check, Copy as CopyIcon } from "lucide-react"
import { ZoneSection } from "./zone-section"
import { Reveal } from "./scroll"

const EMAIL = "dashiell.russell@gmail.com"

const TOPICS = [
  "A role or opportunity",
  "A project or collaboration",
  "Mentoring or a talk",
  "Something else",
] as const

/**
 * Contact: a short form plus the direct channels.
 *
 * There is no mail backend yet, so sending composes the message in the
 * visitor's own mail app (a prefilled mailto:) rather than pretending to send
 * from the site. The address is also one click to copy for webmail users.
 */
export function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", org: "", topic: TOPICS[0] as string, message: "" })
  const [error, setError] = useState<string | null>(null)
  const [opened, setOpened] = useState(false)
  const [copied, setCopied] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return setError("Add your name.")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("That email address doesn't look right.")
    if (form.message.trim().length < 10) return setError("Add a line or two about what you have in mind.")
    setError(null)
    const subject = `${form.topic} — ${form.name}${form.org ? `, ${form.org}` : ""}`
    const body = `${form.message.trim()}\n\n— ${form.name}${form.org ? `, ${form.org}` : ""}\n${form.email}`
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setOpened(true)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked; the address is visible to select by hand
    }
  }

  const field = "w-full border bg-transparent px-4 py-3 outline-none transition-colors focus:border-[var(--accent)]"
  const fieldStyle = { borderColor: "var(--border-strong)" }

  return (
    <ZoneSection zone="ground" id="contact" className="border-t" style={{ borderColor: "var(--border)" }}>
      <div className="container-page grid gap-16 py-[var(--section-y)] lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <p className="label label-accent mb-5">Contact</p>
          <h2 className="headline mb-8 max-w-md">Building something that has to work the first time?</h2>
          <p className="mb-10 max-w-md leading-relaxed text-[var(--muted-foreground)]">
            Spacecraft electronics, avionics, robotics, embedded systems — tell me what you are working on.
          </p>

          <dl className="grid gap-6">
            <div>
              <dt className="label mb-2">Email</dt>
              <dd className="flex flex-wrap items-center gap-3">
                <a href={`mailto:${EMAIL}`} className="hover:text-[var(--accent)]">{EMAIL}</a>
                <button type="button" onClick={copy} className="label inline-flex items-center gap-1.5 hover:text-[var(--accent)]">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </dd>
            </div>
            <div>
              <dt className="label mb-2">LinkedIn</dt>
              <dd>
                <a href="https://www.linkedin.com/in/dashiell-russell-9973482a1" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)]">
                  Dashiell Russell
                </a>
              </dd>
            </div>
            <div>
              <dt className="label mb-2">Based in</dt>
              <dd>Sydney, Australia</dd>
            </div>
            <div>
              <dt className="label mb-2">Résumé</dt>
              <dd>
                <a href="/Dashiell Russell - Resume.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)]">
                  Download PDF
                </a>
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.08}>
          <form onSubmit={submit} noValidate className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="label">Name</span>
                <input className={field} style={fieldStyle} value={form.name} onChange={set("name")} autoComplete="name" />
              </label>
              <label className="grid gap-2">
                <span className="label">Email</span>
                <input className={field} style={fieldStyle} type="email" value={form.email} onChange={set("email")} autoComplete="email" />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="label">Organisation (optional)</span>
                <input className={field} style={fieldStyle} value={form.org} onChange={set("org")} autoComplete="organization" />
              </label>
              <label className="grid gap-2">
                <span className="label">About</span>
                <select className={field} style={{ ...fieldStyle, background: "var(--background)" }} value={form.topic} onChange={set("topic")}>
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2">
              <span className="label">Message</span>
              <textarea className={`${field} min-h-40 resize-y`} style={fieldStyle} value={form.message} onChange={set("message")} />
            </label>

            {error ? <p className="label" style={{ color: "#ff7a6a" }} role="alert">{error}</p> : null}
            {opened && !error ? (
              <p className="label" role="status">
                Your mail app should have opened with the message ready to send. If not, email {EMAIL} directly.
              </p>
            ) : null}

            <div>
              <button
                type="submit"
                className="group inline-flex items-center gap-3 px-7 py-4 transition-colors"
                style={{ background: "var(--foreground)", color: "var(--background)" }}
              >
                <span className="label" style={{ color: "inherit" }}>Send message</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </ZoneSection>
  )
}
