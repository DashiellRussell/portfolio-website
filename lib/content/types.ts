/**
 * Content model.
 *
 * The site is organised by ORGANISATION, not by project: the home page lists
 * the places I have worked, and each one owns the projects done there. Role
 * progression within an organisation is first-class, so moving from intern to
 * engineer reads as a promotion rather than two unrelated entries.
 *
 * Anything the site asserts about real hardware, launches, or missions must be
 * verifiable. Unconfirmed fields carry a `TODO:` string so an unverified claim
 * is visible during development; `audit.ts` fails the production build if any
 * survive.
 */

/** Scroll zones. Each shifts the backdrop and accent only. */
export type Zone = "ascent" | "orbit" | "deep" | "ground"

export type Category = "satellite" | "avionics" | "research" | "hardware" | "software"

/**
 * Deliberately explicit about flight heritage — "built" and "flown" are very
 * different claims and the site must never blur them.
 */
export type Status =
  | "flown"
  | "ground-tested"
  | "in-development"
  | "operational"
  | "research"
  | "archived"

/** Which hero visual an entry renders. */
export type Visual = "ascii" | "satellite" | "none"

export interface Spec {
  label: string
  value: string
  note?: string
}

export interface Callout {
  /** Stable id, referenced by hotspots on the annotated diagram. */
  id: string
  title: string
  body: string
  /** Position on the diagram, as a percentage of the viewBox. */
  x: number
  y: number
}

export interface ContentSection {
  heading: string
  body: string[]
  image?: { src: string; alt: string; caption?: string }
}

/** One position held at an organisation. */
export interface Role {
  title: string
  /** Display string, e.g. "Apr 2026". */
  start: string
  /** `null` means current. */
  end: string | null
  bullets: string[]
}

/** A project done within an organisation. */
export interface Project {
  slug: string
  name: string
  tagline: string
  category: Category
  status: Status
  summary: string
  /** Specific, first-person contributions. This is the part that matters. */
  contributions: string[]
  specs: Spec[]
  sections: ContentSection[]
  image?: { src: string; alt: string }
  /** Annotated 2D diagram, if the project has one. */
  diagram?: { alt: string; callouts: Callout[] }
  links?: { label: string; href: string }[]
}

export interface Experience {
  slug: string
  /** Organisation name — this is what the home page shows. */
  name: string
  tagline: string
  zone: Zone
  /** Newest role first. */
  roles: Role[]
  summary: string
  hero?: { src: string; alt: string }
  /** Which hero treatment to render behind this entry. */
  visual: Visual
  projects: Project[]
  sections: ContentSection[]
  links?: { label: string; href: string }[]
}
