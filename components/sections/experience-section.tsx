"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Calendar } from "lucide-react"
import { motion } from "framer-motion"

const experiences = [
  {
    company: "University Robotics Lab",
    position: "Robotics Research Assistant",
    period: "2023 - Present",
    location: "University Campus",
    description:
      "Working on autonomous navigation systems and embedded control algorithms. Designing custom PCBs for sensor integration and motor control in research robots.",
    achievements: [
      "Designed and manufactured 3+ custom PCBs for robotics research projects",
      "Implemented sensor fusion algorithms achieving 95% accuracy in object detection",
      "Published research paper on autonomous navigation systems",
    ],
    technologies: ["ROS", "PCB Design", "C++", "Python", "KiCAD", "Arduino"],
  },
  {
    company: "Tech Startup",
    position: "Full-Stack Developer & Hardware Engineer",
    period: "2022 - 2023",
    location: "Remote",
    description:
      "Developed IoT solutions combining custom hardware design with web applications. Built end-to-end products from PCB design to cloud-based dashboards.",
    achievements: [
      "Created 5+ IoT products with custom PCB designs and web interfaces",
      "Reduced production costs by 40% through optimized circuit design",
      "Built real-time data monitoring dashboard serving 10K+ devices",
    ],
    technologies: ["ESP32", "Next.js", "React", "PCB Design", "MQTT", "TypeScript"],
  },
  {
    company: "Robotics Competition Team",
    position: "Team Lead & Engineer",
    period: "2021 - 2022",
    location: "University",
    description:
      "Led team of 8 students in designing and building competition robots. Responsible for electrical systems, embedded programming, and mechanical integration.",
    achievements: [
      "Won 2nd place in regional robotics competition with custom-built robot",
      "Designed power distribution and motor control PCBs for competition robot",
      "Implemented autonomous navigation using sensor fusion and PID control",
    ],
    technologies: ["Arduino", "CAD", "PCB Design", "C/C++", "3D Printing"],
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
            Robotics, hardware design, and software development experience
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
