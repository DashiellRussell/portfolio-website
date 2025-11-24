"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Calendar, MapPin } from "lucide-react"
import { motion } from "framer-motion"

const experiences = [
  {
    id: "coming-soon",
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
    id: "freelance",
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
    id: "ramsoc-director",
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
    id: "ramsoc-subcom",
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
    id: "rocketry",
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
    <section id="experience" className="py-24 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Work Experience
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            My professional journey in software engineering and robotics.
          </p>
        </motion.div>

        <Tabs defaultValue={experiences[0].id} className="flex flex-col md:flex-row gap-8">
          <TabsList className="flex md:flex-col h-auto bg-transparent p-0 gap-2 md:w-64 overflow-x-auto md:overflow-visible justify-start">
            {experiences.map((exp) => (
              <TabsTrigger
                key={exp.id}
                value={exp.id}
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-l-2 border-transparent data-[state=active]:border-primary rounded-none transition-all text-left whitespace-nowrap md:whitespace-normal"
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{exp.company}</span>
                  <span className="text-xs text-muted-foreground font-normal hidden md:inline-block line-clamp-1">{exp.position}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 min-h-[400px]">
            {experiences.map((exp) => (
              <TabsContent key={exp.id} value={exp.id} className="mt-0 h-full">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Card className={`h-full p-6 md:p-8 border-none shadow-lg bg-card/50 backdrop-blur-sm ${exp.comingSoon ? "border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5" : ""
                    }`}>
                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <h3 className={`text-2xl font-bold ${exp.comingSoon ? "text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent" : ""}`}>
                          {exp.position}
                        </h3>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted/50 px-3 py-1 rounded-full w-fit">
                          <Calendar className="h-3 w-3" />
                          {exp.period}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-primary font-medium">
                        <Briefcase className="h-4 w-4" />
                        {exp.company}
                        <span className="text-muted-foreground mx-2">•</span>
                        <span className="text-muted-foreground text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {exp.location}
                        </span>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
                      {exp.description}
                    </p>

                    <div className="mb-8">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary rounded-full" />
                        Key Achievements
                      </h4>
                      <ul className="space-y-3">
                        {exp.achievements.map((achievement, i) => (
                          <li key={i} className="flex items-start gap-3 text-muted-foreground">
                            <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto pt-6 border-t border-border/50">
                      {exp.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </section>
  )
}
