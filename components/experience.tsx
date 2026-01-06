"use client"

import { useState } from "react"
import { ChevronDown, Sparkles, Briefcase } from "lucide-react"

export function Experience() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const experiences = [
    {
      title: "Exciting New Opportunity",
      company: "Exciting New Opportunity",
      location: "TBA",
      period: "2025",
      type: "Coming Soon",
      description:
        "Something exciting is in the works! Stay tuned for updates on my next venture in engineering and technology.",
      details: ["Details to be announced soon...", "Watch this space for major developments", "Big things are coming!"],
      tags: ["Innovation", "Engineering", "Technology", "Growth"],
      icon: <Sparkles className="h-6 w-6" />,
    },
    {
      title: "Freelance Software Developer",
      company: "Self-Employed",
      location: "Sydney, Australia",
      period: "2024 - Present",
      type: "Freelance",
      description:
        "Providing full-stack web development services to clients, specializing in Next.js, React, and modern web technologies.",
      details: [
        "Built custom websites and web applications for various clients including e-commerce platforms",
        "Developed Bicycles2U website with bike sizing calculator and service booking system",
        "Specialized in Next.js 15, React 19, TypeScript, and modern CSS frameworks",
        "Delivered responsive, accessible, and performant solutions",
        "Collaborated directly with clients to understand requirements and deliver quality products",
      ],
      tags: ["Next.js", "React", "TypeScript", "Freelance", "Full-Stack"],
      icon: <Briefcase className="h-6 w-6" />,
    },
    {
      title: "IT Director",
      company: "UNSW Robotics and Mechatronics Society",
      location: "UNSW Sydney",
      period: "2025 - Present",
      type: "Leadership",
      description:
        "Leading the IT department for UNSW Robotics and Mechatronics Society, overseeing all digital infrastructure and technology initiatives.",
      details: [
        "Managing and directing all IT operations for the society",
        "Leading development of society website (ramsoc.unsw.edu.au) and digital platforms",
        "Coordinating technology requirements for major robotics events and competitions",
        "Implementing new digital solutions to improve member engagement",
        "Managing IT team and delegating technical projects",
      ],
      tags: ["Leadership", "Next.js", "React", "Web Development", "IT Management"],
      icon: <Briefcase className="h-6 w-6" />,
    },
    {
      title: "IT Subcommittee Member",
      company: "UNSW Robotics and Mechatronics Society",
      location: "UNSW Sydney",
      period: "2025",
      type: "Committee",
      description: "Contributed to IT projects and digital infrastructure for the Robotics and Mechatronics Society.",
      details: [
        "Developed and maintained society digital platforms and website",
        "Built Pickabots live match dashboard with real-time WebSocket communication",
        "Helped coordinate IT requirements for robotics competitions and workshops",
        "Collaborated on improving member engagement through digital solutions",
      ],
      tags: ["Next.js", "React", "Supabase", "WebSockets", "Web Development"],
      icon: <Briefcase className="h-6 w-6" />,
    },
    {
      title: "Avionics Engineer",
      company: "UNSW Rocketry Team",
      location: "UNSW Sydney",
      period: "2025 - Present",
      type: "Engineering",
      description:
        "Designing and developing avionics systems for high-powered rocket projects. Working on flight computers, sensor integration, and telemetry systems.",
      details: [
        "Designed and programmed custom flight computer systems for rocket guidance",
        "Integrated sensors for altitude, acceleration, and orientation tracking",
        "Developed telemetry systems for real-time data transmission during flight",
        "Collaborated with mechanical and propulsion teams on rocket integration",
        "Participated in test launches and system validation",
      ],
      tags: ["Embedded Systems", "C/C++", "Sensors", "Telemetry", "Arduino"],
      icon: <Briefcase className="h-6 w-6" />,
    },
    {
      title: "Engineering Student",
      company: "UNSW Sydney",
      location: "Sydney, Australia",
      period: "2023 - Present",
      type: "Education",
      description:
        "Pursuing Bachelor of Engineering (Honours) in Mechatronics Engineering with focus on robotics, embedded systems, and control theory.",
      details: [
        "Completed coursework in programming, electronics, mechanics, and control systems",
        "Developed hands-on skills in PCB design, microcontroller programming, and robotics",
        "Engaged in multiple engineering projects combining hardware and software",
        "Active member of UNSW Robotics and Mechatronics Society and Rocketry Team",
      ],
      tags: ["Mechatronics", "Robotics", "Embedded Systems", "Engineering", "UNSW"],
      icon: <Briefcase className="h-6 w-6" />,
    },
  ]

  return (
    <section id="experience" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 uppercase tracking-tight">Work Experience</h2>
          <p className="text-xl text-foreground/70 font-medium">
            My professional journey in software engineering and robotics.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-border hidden md:block" />

            <div className="space-y-8">
              {experiences.map((exp, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute left-0 top-6 w-10 h-10 bg-accent text-accent-foreground border-4 border-border -translate-x-[18px] hidden md:flex items-center justify-center shadow-brutal-sm">
                    {exp.icon}
                  </div>

                  <div className="md:pl-12">
                    <button
                      onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                      className={`w-full text-left bg-card border-4 border-border p-6 transition-all group relative overflow-hidden ${
                        exp.type === "Coming Soon"
                          ? "shadow-glow"
                          : "shadow-brutal hover:shadow-brutal-lg hover:translate-x-1 hover:translate-y-1"
                      }`}
                    >
                      {exp.type === "Coming Soon" && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-0 bg-accent/5" />
                          <div className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-accent/20 to-transparent animate-mist blur-xl" />
                        </div>
                      )}
                      <div className="flex justify-between items-start gap-4 relative z-10">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-2xl font-bold text-foreground uppercase tracking-wide">{exp.title}</h3>
                            <span className="text-xs px-3 py-1 bg-pink text-pink-foreground border-4 border-border font-bold uppercase">
                              {exp.type}
                            </span>
                          </div>
                          <p className="text-lg text-foreground font-bold">{exp.company}</p>
                          {exp.location && <p className="text-sm text-foreground/70 font-medium">{exp.location}</p>}
                          <p className="text-sm font-bold font-mono bg-amber text-amber-foreground inline-block px-3 py-1 border-4 border-border">
                            {exp.period}
                          </p>
                          <p className="text-foreground/70 leading-relaxed mt-3 font-medium">{exp.description}</p>
                        </div>
                        <ChevronDown
                          className={`h-6 w-6 text-accent transition-transform flex-shrink-0 ${
                            expandedIndex === idx ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {expandedIndex === idx && (
                      <div className="mt-4 bg-card border-4 border-border border-t-0 p-6 pt-4 shadow-brutal-lg">
                        <h4 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wide">
                          Key Achievements
                        </h4>
                        <ul className="space-y-4 mb-6">
                          {exp.details.map((detail, detailIdx) => (
                            <li key={detailIdx} className="flex gap-4">
                              <span className="text-accent text-2xl font-bold mt-1">•</span>
                              <span className="text-foreground/70 leading-relaxed flex-1 font-medium">{detail}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap gap-3">
                          {exp.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="px-3 py-1 bg-accent text-accent-foreground text-xs font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
