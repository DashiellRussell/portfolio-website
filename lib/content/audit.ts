import { experiences } from "./experiences"
import { DETAILS_LIVE } from "./flags"
import type { Experience } from "./types"

/**
 * Guards against shipping unverified copy.
 *
 * The overhaul deliberately scaffolds every product with `TODO:` placeholders
 * rather than plausible-sounding invented detail, because a portfolio that
 * overstates flight heritage or authorship is worse than one that is
 * incomplete. This turns "I forgot to fill that in" from a credibility problem
 * into a build failure.
 */

const MARKER = "TODO:"

export interface Placeholder {
  slug: string
  path: string
  text: string
}

function walk(value: unknown, path: string, slug: string, out: Placeholder[]) {
  if (typeof value === "string") {
    if (value.trimStart().startsWith(MARKER) || value.trim() === "TODO") {
      out.push({ slug, path, text: value })
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, slug, out))
    return
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      walk(v, path ? `${path}.${k}` : k, slug, out)
    }
  }
}

export function findPlaceholders(list: Experience[] = experiences): Placeholder[] {
  const out: Placeholder[] = []
  for (const p of list) walk(p, "", p.slug, out)
  return out
}

/** True when a single string is an unfilled placeholder. */
export function isPlaceholder(value: string): boolean {
  return value.trimStart().startsWith(MARKER) || value.trim() === "TODO"
}

/**
 * Placeholders on what a visitor can see while the detail pages are held
 * back (`DETAILS_LIVE` off): each card's name, one-liner and current role,
 * and the project names the holding pages show.
 */
export function findVisiblePlaceholders(list: Experience[] = experiences): Placeholder[] {
  const out: Placeholder[] = []
  for (const e of list) {
    const r = e.roles[0]
    const fields: [string, unknown][] = [
      ["name", e.name],
      ["tagline", e.tagline],
      ["roles[0].title", r?.title],
      ["roles[0].start", r?.start],
      ["roles[0].end", r?.end ?? ""],
      ...e.projects.map((p, i) => [`projects[${i}].name`, p.name] as [string, unknown]),
    ]
    for (const [path, v] of fields) walk(v, path, e.slug, out)
  }
  return out
}

/**
 * Called from the page modules. In development and on Vercel preview
 * deployments it reports; in a production build it throws, so incomplete
 * content cannot reach the live site by accident.
 */
export function assertContentComplete() {
  // with the detail pages held back, only the visible fields have to be real
  const found = DETAILS_LIVE ? findPlaceholders() : findVisiblePlaceholders()
  if (found.length === 0) return

  const summary = found.map((f) => `  ${f.slug} → ${f.path}`).join("\n")

  const preview = process.env.VERCEL_ENV === "preview"
  if (process.env.NODE_ENV === "production" && !preview && process.env.ALLOW_PLACEHOLDER_CONTENT !== "1") {
    throw new Error(
      `Refusing to build: ${found.length} unverified placeholder(s) remain in lib/content/experiences.ts.\n` +
        `${summary}\n\n` +
        `Fill these in with confirmed facts, or set ALLOW_PLACEHOLDER_CONTENT=1 to build a preview anyway.`
    )
  }

  console.warn(`\n[content] ${found.length} placeholder(s) still to fill:\n${summary}\n`)
}
