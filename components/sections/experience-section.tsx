"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Calendar } from "lucide-react"
import { motion } from "framer-motion"

const experiences = [
  {
    company: "TechCorp Solutions",
    position: "Senior Full-Stack Developer",
    period: "2022 - Present",
    location: "San Francisco, CA",
    description:
      "Leading development of enterprise web applications using React and Node.js. Mentoring junior developers and establishing best practices for the team.",
    achievements: [
      "Architected and deployed 5+ production applications serving 100K+ users",
      "Reduced application load time by 60% through optimization techniques",
      "Implemented CI/CD pipeline reducing deployment time by 75%",
    ],
    technologies: ["React", "Next.js", "TypeScript", "AWS", "PostgreSQL"],
  },
  {
    company: "StartupHub Inc",
    position: "Full-Stack Developer",
    period: "2020 - 2022",
    location: "Remote",
    description:
      "Developed and maintained multiple client projects from concept to deployment. Collaborated with designers and product managers to deliver high-quality solutions.",
    achievements: [
      "Built 10+ responsive web applications for various clients",
      "Improved code quality by implementing automated testing (90% coverage)",
      "Contributed to open-source projects used by 1000+ developers",
    ],
    technologies: ["React", "Node.js", "MongoDB", "Express", "Docker"],
  },
  {
    company: "Digital Agency Pro",
    position: "Frontend Developer",
    period: "2019 - 2020",
    location: "New York, NY",
    description:
      "Created pixel-perfect, responsive websites and web applications. Worked closely with design team to implement modern UI/UX patterns.",
    achievements: [
      "Delivered 20+ client websites with 100% satisfaction rate",
      "Reduced development time by 40% through reusable component library",
      "Trained team members on modern frontend best practices",
    ],
    technologies: ["React", "JavaScript", "Sass", "Webpack", "Git"],
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
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Work Experience</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            My professional journey and key accomplishments
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <motion.div
                key={exp.company}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-primary border-4 border-background hidden md:block" />

                <Card className="md:ml-20 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{exp.position}</h3>
                      <div className="flex items-center gap-2 text-primary font-semibold mb-2">
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
