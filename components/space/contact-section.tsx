"use client"

import { useState } from "react"
import { ArrowRight, Check, Copy as CopyIcon } from "lucide-react"
import { ZoneSection } from "./zone-section"
import { Reveal } from "./scroll"

const EMAIL = "dashiell.russell@gmail.com"

/**
 * Contact: a short form plus the direct channels. The form posts to
 * /api/contact, which emails me and sends the visitor a confirmation.
 */
export function ContactSection() {
  const empty = { name: "", email: "", org: "", subject: "", message: "", website: "" }
  const [form, setForm] = useState(empty)
  // invalid fields just turn red; `error` is only for a failed send
  const [bad, setBad] = useState({ name: false, email: false })
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [copied, setCopied] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (k === "name" || k === "email") setBad((b) => ({ ...b, [k]: false }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "sending") return
    const invalid = { name: !form.name.trim(), email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) }
    setBad(invalid)
    if (invalid.name || invalid.email) return
    setError(null)
    setStatus("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(out.error || "Couldn't send right now.")
      setStatus("sent")
      setForm(empty)
    } catch (err) {
      setStatus("idle")
      setError(err instanceof Error ? err.message : "Couldn't send right now.")
    }
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
  const badStyle = { borderColor: "#ff5a4a", boxShadow: "0 0 0 1px #ff5a4a inset" }

  return (
    <ZoneSection zone="ground" id="contact" className="border-t" style={{ borderColor: "var(--border)" }}>
      <div className="container-page grid gap-16 py-[var(--section-y)] lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <p className="label label-accent mb-5">Contact</p>
          <h2 className="headline mb-8 max-w-md">Let&apos;s talk.</h2>
          <p className="mb-10 max-w-md leading-relaxed text-[var(--muted-foreground)]">
            Spacecraft electronics, avionics, robotics, embedded systems. Tell me what you are working on.
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
                <input className={field} style={bad.name ? badStyle : fieldStyle} aria-invalid={bad.name} value={form.name} onChange={set("name")} autoComplete="name" />
              </label>
              <label className="grid gap-2">
                <span className="label">Email</span>
                <input className={field} style={bad.email ? badStyle : fieldStyle} aria-invalid={bad.email} type="email" value={form.email} onChange={set("email")} autoComplete="email" />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="label">Organisation (optional)</span>
                <input className={field} style={fieldStyle} value={form.org} onChange={set("org")} autoComplete="organization" />
              </label>
              <label className="grid gap-2">
                <span className="label">Subject (optional)</span>
                <input className={field} style={fieldStyle} value={form.subject} onChange={set("subject")} />
              </label>
            </div>
            <label className="grid gap-2">
              <span className="label">Message (optional)</span>
              <textarea className={`${field} min-h-40 resize-y`} style={fieldStyle} value={form.message} onChange={set("message")} />
            </label>

            {/* honeypot: hidden from people and screen readers, irresistible to bots */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.website}
              onChange={set("website")}
              style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
            />

            {error ? <p className="label" style={{ color: "#ff7a6a" }} role="alert">{error}</p> : null}
            {status === "sent" ? (
              <p className="label" style={{ color: "var(--zone-ground)" }} role="status">
                Sent. Check your inbox for a confirmation; I&apos;ll get back to you soon.
              </p>
            ) : null}

            <div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="group inline-flex items-center gap-3 px-7 py-4 transition-opacity disabled:opacity-60"
                style={{ background: "var(--foreground)", color: "var(--background)" }}
              >
                <span className="label" style={{ color: "inherit" }}>
                  {status === "sending" ? "Sending…" : "Send message"}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </ZoneSection>
  )
}
