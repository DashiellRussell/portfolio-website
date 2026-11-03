/**
 * Candidate looks for the solar arrays.
 *
 * Anodised aluminium is a *satin* metallic — a coloured oxide layer over
 * metal — so it sits between a mirror and a matte paint. Roughness is the
 * dial that decides which it reads as: below ~0.1 it mirrors and the colour
 * washes out, above ~0.45 it goes chalky and stops looking like metal. Several
 * of these variants exist to bracket that range so the right point can be
 * picked by eye rather than argued about.
 */

export interface PanelVariant {
  id: string
  name: string
  note: string
  /** Cell-texture gradient stops, light to dark to light. */
  stops: [string, string, string]
  /** Seam colour drawn over the base. */
  seam: string
  /** Multiplies the map — controls how much the environment washes it out. */
  tint: number
  metalness: number
  roughness: number
  envMapIntensity: number
  emissive: number
  emissiveIntensity: number
  /** Cell grid density. Fewer, larger cells read as panels; more reads as film. */
  cells: number
}

export const PANEL_VARIANTS: PanelVariant[] = [
  {
    id: "current",
    name: "Current",
    note: "Dark navy mirror. What the site ships today.",
    stops: ["#142d64", "#0f214b", "#18336f"],
    seam: "rgba(135, 168, 220, 0.18)",
    tint: 0xcfdfff,
    metalness: 0.86,
    roughness: 0.08,
    envMapIntensity: 2.05,
    emissive: 0x0d2049,
    emissiveIntensity: 0.35,
    cells: 8,
  },
  {
    id: "satin",
    name: "Satin anodised",
    note: "Higher roughness, strong tint. Closest to real anodised aluminium.",
    stops: ["#2a4f96", "#1d3a72", "#31589f"],
    seam: "rgba(170, 200, 245, 0.22)",
    tint: 0xdce8ff,
    metalness: 0.95,
    roughness: 0.32,
    envMapIntensity: 1.5,
    emissive: 0x101f45,
    emissiveIntensity: 0.2,
    cells: 6,
  },
  {
    id: "brushed",
    name: "Brushed anodised",
    note: "Satin, but darker and cooler. Sheen instead of glare.",
    stops: ["#27436e", "#1e3663", "#2d5084"],
    seam: "rgba(165, 192, 232, 0.21)",
    tint: 0xd4e2f6,
    metalness: 0.97,
    roughness: 0.42,
    envMapIntensity: 1.25,
    emissive: 0x0c1a3a,
    emissiveIntensity: 0.18,
    cells: 5,
  },
  {
    id: "electric",
    name: "Electric anodised",
    note: "Saturated blue oxide, tight highlight. Boldest of the set.",
    stops: ["#1f56c8", "#1740a0", "#2a63d8"],
    seam: "rgba(190, 215, 255, 0.25)",
    tint: 0xe8f0ff,
    metalness: 0.92,
    roughness: 0.24,
    envMapIntensity: 1.7,
    emissive: 0x143a8c,
    emissiveIntensity: 0.3,
    cells: 6,
  },
  {
    id: "steel",
    name: "Steel blue",
    note: "Barely blue. Reads as metal first, colour second.",
    stops: ["#3c5578", "#2c405e", "#455f85"],
    seam: "rgba(190, 205, 230, 0.2)",
    tint: 0xdfe8f5,
    metalness: 0.98,
    roughness: 0.28,
    envMapIntensity: 1.6,
    emissive: 0x141d2c,
    emissiveIntensity: 0.15,
    cells: 5,
  },
  {
    id: "glass",
    name: "Cobalt glass",
    note: "Deep gloss, near-mirror. Solar cell rather than anodised metal.",
    stops: ["#0e2358", "#081538", "#122a66"],
    seam: "rgba(120, 155, 215, 0.16)",
    tint: 0xbcd2ff,
    metalness: 0.6,
    roughness: 0.05,
    envMapIntensity: 2.4,
    emissive: 0x0a1c4c,
    emissiveIntensity: 0.4,
    cells: 10,
  },
]

export interface LightingVariant {
  id: string
  name: string
  note: string
  exposure: number
  /** Key light: colour, intensity, position. */
  sun: { color: number; intensity: number; pos: [number, number, number] }
  fill: { color: number; intensity: number; pos: [number, number, number] }
  rim: { color: number; intensity: number; pos: [number, number, number] }
  ambient: { color: number; intensity: number }
  /** Environment scene colours. */
  sky: number
  planet: number
  bounce: number
}

export const LIGHTING_VARIANTS: LightingVariant[] = [
  {
    id: "orbit",
    name: "Orbit",
    note: "Current setup. Hard sun, blue earthshine fill.",
    exposure: 1.75,
    sun: { color: 0xfff6ea, intensity: 4.6, pos: [6, 5, 5] },
    fill: { color: 0x6f9fdf, intensity: 1.5, pos: [-4, -5, -2] },
    rim: { color: 0xbcd4ff, intensity: 1.1, pos: [-7, 3, -6] },
    ambient: { color: 0x9fb4d0, intensity: 0.5 },
    sky: 0x0a1424,
    planet: 0x3f77c8,
    bounce: 0x8fa8c8,
  },
  {
    id: "hard",
    name: "Hard sun",
    note: "One dominant source, deep shadow. Most dramatic.",
    // Exposure carries the brightness so the sun/fill ratio — which is what
    // makes this variant read as hard — stays intact.
    exposure: 2.1,
    sun: { color: 0xfffaf0, intensity: 6.5, pos: [7, 6, 4] },
    fill: { color: 0x2f4f80, intensity: 0.4, pos: [-4, -4, -2] },
    rim: { color: 0x7fa0d0, intensity: 0.5, pos: [-8, 2, -6] },
    ambient: { color: 0x60758f, intensity: 0.28 },
    sky: 0x0b1320,
    planet: 0x2a5590,
    bounce: 0x5a70a0,
  },
  {
    id: "studio",
    name: "Studio",
    note: "Soft and even. Shows the finish, loses the drama.",
    exposure: 1.9,
    sun: { color: 0xffffff, intensity: 3.2, pos: [5, 6, 6] },
    fill: { color: 0xa8c4e8, intensity: 2.2, pos: [-5, -2, 3] },
    rim: { color: 0xd8e6ff, intensity: 1.8, pos: [-6, 4, -5] },
    ambient: { color: 0xc0d0e8, intensity: 0.9 },
    sky: 0x162030,
    planet: 0x6f9ad8,
    bounce: 0xc0d0e0,
  },
  {
    id: "terminator",
    name: "Terminator",
    note: "Low grazing sun, strong planet glow. Warmest read.",
    exposure: 1.85,
    sun: { color: 0xffe8c8, intensity: 5.2, pos: [9, 1.5, 3] },
    fill: { color: 0x4f86d8, intensity: 2.0, pos: [-3, -6, -1] },
    rim: { color: 0xffd0a0, intensity: 1.2, pos: [-8, 0, -5] },
    ambient: { color: 0x8fa8c8, intensity: 0.45 },
    sky: 0x080f1c,
    planet: 0x4f8fd8,
    bounce: 0xa8b8c8,
  },
]
