import type { Experience } from "./types"

/**
 * Where I have worked, newest and most significant first.
 *
 * Order on the home page is the order of this array. Spiral Blue leads, then
 * Phase Robotics, then the rest of the space work.
 *
 * IMPORTANT: strings beginning with "TODO:" are unverified placeholders. They
 * render with a visible marker in development and fail the production build
 * (see `audit.ts`). Replace them with confirmed facts — never delete the marker
 * and leave invented copy in its place.
 */

export const experiences: Experience[] = [
  // ---------------------------------------------------------------- Spiral Blue
  {
    slug: "spiral-blue",
    name: "Spiral Blue",
    tagline: "Flight hardware and software for Sapphire V2 — the spacecraft MCU board and the code that runs on it.",
    zone: "orbit",
    visual: "satellite",
    roles: [
      {
        title: "Mechatronics Space Engineer",
        // NOTE: confirm the exact start date — recorded from "started two weeks
        // ago" as of early September 2026.
        start: "Aug 2026",
        end: null,
        bullets: ["TODO: what you are responsible for in this role."],
      },
      {
        title: "Intern",
        start: "Apr 2026",
        end: "Aug 2026",
        bullets: ["TODO: what you worked on during the internship."],
      },
    ],
    summary:
      "TODO: what Spiral Blue builds, and what you do there. Keep this to what is public.",
    projects: [
      {
        slug: "sapphire-v2",
        name: "Sapphire V2",
        tagline: "TODO: one line on the spacecraft and its mission.",
        category: "satellite",
        status: "in-development", // TODO: confirm
        summary:
          "TODO: two or three sentences on what Sapphire V2 is and what it does in orbit.",
        contributions: [
          "Designed the microcontroller board for the spacecraft bus.",
          "Wrote the flight software running on it.",
          // TODO: expand — subsystems driven, interfaces, language/RTOS, fault handling.
        ],
        specs: [
          { label: "Form factor", value: "TODO" },
          { label: "MCU", value: "TODO" },
          { label: "Bus", value: "TODO" },
          { label: "Downlink", value: "TODO" },
        ],
        sections: [
          {
            heading: "The MCU board",
            body: [
              "TODO: what the board does, why it was designed that way, the constraints that shaped it (power, thermal, mass, interfaces), and what you would change.",
            ],
          },
          {
            heading: "Flight software",
            body: [
              "TODO: software architecture, language and runtime, fault handling, and how it was tested before integration.",
            ],
          },
        ],
        diagram: {
          alt: "Sapphire V2 subsystem schematic",
          callouts: [
            {
              id: "MCU",
              title: "Microcontroller board",
              body: "TODO: processor, responsibilities, interfaces to the rest of the bus. This is your primary contribution, so give it the most detail.",
              x: 50,
              y: 47.5,
            },
            {
              id: "ADCS",
              title: "Attitude determination and control",
              body: "TODO: describe, and state clearly whether you contributed to this subsystem or are describing a teammate's work.",
              x: 50,
              y: 36,
            },
            {
              id: "EPS",
              title: "Electrical power system",
              body: "TODO: describe the power system and your involvement, if any.",
              x: 50,
              y: 59,
            },
            {
              id: "COMMS",
              title: "Communications",
              body: "TODO: describe the radio and antenna, and your involvement, if any.",
              x: 50,
              y: 17,
            },
            {
              id: "PAYLOAD",
              title: "Payload",
              body: "TODO: describe the payload and your involvement, if any.",
              x: 50,
              y: 72.5,
            },
            {
              id: "SOLAR",
              title: "Solar arrays",
              body: "TODO: describe the arrays and your involvement, if any.",
              x: 19,
              y: 49,
            },
          ],
        },
        links: [],
      },
    ],
    sections: [],
    links: [],
  },

  // ----------------------------------------------------------- Phase Robotics
  {
    slug: "phase-robotics",
    name: "Phase Robotics",
    tagline: "Robotic arms, stator winders, and robotics simulation and automation.",
    zone: "deep",
    visual: "robotics",
    roles: [
      {
        title: "CTO",
        start: "Jan 2026",
        end: null,
        bullets: ["TODO: what you are responsible for as CTO."],
      },
    ],
    summary: "TODO: what Phase Robotics is and how the projects relate to each other.",
    projects: [
      {
        slug: "motor-winder",
        name: "Motor winder",
        tagline: "TODO: one line.",
        category: "hardware",
        status: "in-development",
        summary: "TODO: why a custom winder was needed and what it produces.",
        contributions: ["TODO: what you built."],
        specs: [{ label: "Focus", value: "TODO" }],
        sections: [{ heading: "Mechanism", body: ["TODO: how it works."] }],
        links: [],
      },
      {
        slug: "robot-arm",
        name: "Robot arm",
        tagline: "TODO: one line.",
        category: "hardware",
        status: "in-development",
        summary: "TODO: the arm's purpose and design.",
        contributions: ["TODO: which parts are yours."],
        specs: [{ label: "DOF", value: "TODO" }],
        sections: [
          { heading: "Design", body: ["TODO: mechanics, actuation, control approach."] },
        ],
        links: [],
      },
      {
        slug: "isaac-sim",
        name: "Isaac Sim",
        tagline: "TODO: one line.",
        category: "software",
        status: "research",
        summary: "TODO: what you simulated and why.",
        contributions: ["TODO: what you modelled and what it told you."],
        specs: [{ label: "Tool", value: "NVIDIA Isaac Sim" }],
        sections: [
          {
            heading: "Simulation",
            body: ["TODO: what the sim told you that hardware could not."],
          },
        ],
        links: [],
      },
    ],
    sections: [],
    links: [],
  },

  // ------------------------------------------------------------- UNSW Rocketry
  {
    slug: "unsw-rocketry",
    name: "UNSW Rocketry",
    tagline: "Avionics for competition rockets — flight computers, telemetry, and battery management.",
    zone: "ascent",
    visual: "nozzle",
    roles: [
      {
        title: "Avionics Engineer",
        start: "Oct 2025",
        end: null,
        bullets: [
          "Built and tested avionics systems for competition rocket flights.",
          "Worked with the wider engineering team to integrate sensors and telemetry.",
        ],
      },
    ],
    summary:
      "TODO: what the avionics group does and what you own within it.",
    projects: [
      {
        slug: "flight-computers",
        name: "Flight computers",
        tagline: "TODO: one line.",
        category: "avionics",
        // TODO: confirm per board which actually flew. "built" and "flown" are
        // different claims and this field must not blur them.
        status: "ground-tested",
        summary:
          "TODO: what the avionics stack does — sensing, state estimation, deployment logic, logging — and its actual flight heritage.",
        contributions: ["TODO: name the specific boards, and separate flown from bench-tested."],
        specs: [
          { label: "Platform", value: "TODO" },
          { label: "Sensing", value: "TODO" },
          { label: "Flights", value: "TODO: confirm before publishing" },
        ],
        sections: [
          {
            heading: "Architecture",
            body: ["TODO: sensors, filtering, deployment state machine, logging."],
          },
          {
            heading: "Test and flight history",
            body: [
              "TODO: be explicit about what was bench-tested, what was ground-tested, and what flew.",
            ],
          },
        ],
        links: [
          {
            label: "MPR altitude logger",
            href: "https://github.com/DashiellRussell/mpr-altitude-logger",
          },
          {
            label: "Senior flight computer",
            href: "https://github.com/DashiellRussell/UNSW_Rocketry_Senior_Flight_Computer",
          },
        ],
      },
      {
        slug: "aurc-bms",
        name: "AURC BMS",
        tagline: "Battery management hardware for a competition rocket.",
        category: "hardware",
        status: "in-development",
        summary: "TODO: what the BMS does and why it was needed.",
        contributions: ["TODO: which of the four boards you designed, and what each does."],
        specs: [
          { label: "Boards", value: "TODO" },
          { label: "Tool", value: "KiCad" },
        ],
        sections: [
          {
            heading: "Design",
            body: ["TODO: the electrical design and the calculations behind it."],
          },
        ],
        links: [{ label: "Repository", href: "https://github.com/DashiellRussell/aurc-bms" }],
      },
    ],
    sections: [],
    links: [],
  },

  // ------------------------------------------------------------------- RAMSOC
  {
    slug: "ramsoc",
    name: "RAMSOC",
    tagline: "Digital infrastructure for UNSW Robotics and Mechatronics Society.",
    zone: "ground",
    visual: "ramsoc",
    roles: [
      {
        title: "IT Director",
        start: "Jan 2025",
        end: null,
        bullets: [
          "Led development and maintenance of the society's website, IT systems, and digital tools.",
          "Coordinated a small tech team delivering platforms for events and member engagement.",
        ],
      },
      {
        title: "IT Subcommittee Member",
        start: "TODO: start",
        end: "Dec 2024",
        bullets: ["TODO: what you worked on before stepping up to director."],
      },
    ],
    summary:
      "Directing the society's digital infrastructure — the public website, internal tooling, and the systems that run events.",
    hero: { src: "/ramsocunsw.png", alt: "RAMSOC UNSW website" },
    projects: [
      {
        slug: "ramsoc-website",
        name: "Society website",
        tagline: "The society's public site and member tooling.",
        category: "software",
        status: "operational",
        summary: "TODO: what the site does and what changed under your direction.",
        contributions: ["TODO: what you built versus what the team built."],
        specs: [{ label: "Site", value: "ramsoc.unsw.edu.au" }],
        sections: [{ heading: "What I run", body: ["TODO: the systems and the team."] }],
        links: [],
      },
    ],
    sections: [],
    links: [],
  },

]

export function getExperience(slug: string): Experience | undefined {
  return experiences.find((e) => e.slug === slug)
}

/** Formats a role's date range, e.g. "Apr 2026 — Aug 2026" or "Aug 2026 — Present". */
export function roleRange(role: { start: string; end: string | null }): string {
  return `${role.start} — ${role.end ?? "Present"}`
}
