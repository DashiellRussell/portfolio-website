"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Calendar } from "lucide-react"
import { motion } from "framer-motion"

const experiences = [
  {
    company: "Coming Soon",
    position: "Exciting New Opportunity",
    period: "2025",
    location: "TBA",
    description:
      "Something exciting is in the works! Stay tuned for updates on my next venture in engineering and technology.",
    achievements: [
      "Details to be announced soon...",
      "Watch this space for major developments",
      "Big things are coming!",
    ],
    technologies: ["Innovation", "Engineering", "Technology", "Growth"],
    comingSoon: true,
  },
  {
    company: "Freelance",
    position: "Software Developer",
    period: "2024 - Present",
    location: "Remote",
    description:
      "Building custom web applications and e-commerce solutions for clients. Specializing in Next.js, React, and TypeScript development with focus on performance and user experience.",
    achievements: [
      "Delivered 5+ production websites including e-commerce platforms and society portals",
      "Implemented full-stack features including payment integration and real-time dashboards",
      "Maintained 100% client satisfaction rate with on-time project delivery",
    ],
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js", "Supabase"],
  },
  {
    company: "UNSW Ramsoc",
    position: "IT Director",
    period: "2025 - Present",
    location: "UNSW Sydney",
    description:
      "Leading IT infrastructure and digital initiatives for UNSW Robotics and Mechatronics Society. Managing web development, event technology, and competition systems.",
    achievements: [
      "Architected and deployed society website serving 100+ members",
      "Modenised & fixed critical infrastructure for society",
      "Managed IT operations for team of 6+ people",
    ],
    technologies: ["Next.js", "Supabase", "WebSockets", "React", "shadcn/ui", "PostgreSQL"],
  },
  {
    company: "UNSW Ramsoc",
    position: "IT Subcommittee Member",
    period: "2025 - 2025",
    location: "UNSW Sydney",
    description:
      "Contributed to IT projects and digital infrastructure for the Robotics and Mechatronics Society. Assisted with website development and event technology setup.",
    achievements: [
      "Supported development and maintenance of society digital platforms",
      "Helped coordinate IT requirements for robotics competitions and workshops",
      "Collaborated on improving member engagement through digital solutions",
    ],
    technologies: ["Next.js", "React", "TypeScript", "Git", "Web Development"],
  },
  {
    company: "UNSW Rocketry",
    position: "Avionics Engineer",
    period: "2025 - Present",
    location: "UNSW Sydney",
    description:
      "Designing and developing custom flight computers for high-powered rockets. Responsible for PCB design, sensor integration, telemetry systems, and real-time data acquisition during flight.",
    achievements: [
      "Designed custom flight computer PCBs with IMU, GPS, and barometric sensors",
      "Implemented telemetry system for real-time flight data transmission",
      "Developed embedded software for flight state detection and recovery deployment",
    ],
    technologies: ["PCB Design", "Altium", "C/C++", "IMU", "Telemetry", "Embedded Systems"],
  },
]

export function ExperienceSection() {
  return (
    <section id="experience" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Experience</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Software development, robotics, and hardware engineering roles
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <motion.div
                key={`${exp.company}-${exp.position}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className={`absolute left-6 top-6 w-5 h-5 rounded-full border-4 border-background hidden md:block ${
                  exp.comingSoon ? "bg-gradient-to-r from-primary to-accent animate-pulse" : "bg-primary"
                }`} />

                <Card className={`md:ml-20 p-6 hover:shadow-lg transition-shadow ${
                  exp.comingSoon ? "border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5" : ""
                }`}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div>
                      <h3 className={`text-2xl font-bold mb-1 ${exp.comingSoon ? "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" : ""}`}>
                        {exp.position}
                      </h3>
                      <div className={`flex items-center gap-2 font-semibold mb-2 ${exp.comingSoon ? "text-gradient bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" : "text-primary"}`}>
                        <Briefcase className="h-4 w-4" />
                        {exp.company}
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {exp.period}
                      </div>
                      <div>{exp.location}</div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 leading-relaxed">{exp.description}</p>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Key Achievements:</h4>
                    <ul className="space-y-2">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
