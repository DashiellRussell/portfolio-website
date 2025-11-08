"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

const skillCategories = [
  {
    category: "Software",
    skills: [
      { name: "React/Next.js", level: 90 },
      { name: "TypeScript", level: 88 },
      { name: "Python", level: 85 },
      { name: "C/C++", level: 82 },
      { name: "Node.js", level: 85 },
    ],
  },
  {
    category: "Hardware & Electronics",
    skills: [
      { name: "PCB Design", level: 85 },
      { name: "Eagle/KiCAD", level: 80 },
      { name: "Soldering & Assembly", level: 90 },
      { name: "Circuit Analysis", level: 88 },
      { name: "Power Systems", level: 75 },
    ],
  },
  {
    category: "Robotics & Embedded",
    skills: [
      { name: "Arduino/ESP32", level: 92 },
      { name: "ROS", level: 75 },
      { name: "Sensor Integration", level: 88 },
      { name: "Motor Control", level: 85 },
      { name: "Embedded C", level: 80 },
    ],
  },
]

const technologies = [
  "React",
  "Next.js",
  "TypeScript",
  "Python",
  "C/C++",
  "Arduino",
  "ESP32",
  "Raspberry Pi",
  "PCB Design",
  "KiCAD",
  "Eagle",
  "Fusion 360",
  "SolidWorks",
  "ROS",
  "MATLAB",
  "Node.js",
  "Git",
  "Linux",
  "3D Printing",
  "CAD",
]

export function SkillsSection() {
  return (
    <section id="skills" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Skills & Expertise</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Hardware, software, and everything in between
          </p>
        </motion.div>

        {/* Skill bars */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {skillCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <Card className="p-6 h-full hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all">
                <h3 className="text-xl font-semibold mb-6 text-primary">{category.category}</h3>
                <div className="space-y-4">
                  {category.skills.map((skill, skillIndex) => (
                    <div key={skill.name}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <span className="text-sm text-muted-foreground">{skill.level}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: categoryIndex * 0.1 + skillIndex * 0.1 }}
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-sm shadow-primary/30"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Technology badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h3 className="text-2xl font-semibold mb-6">Technologies I Work With</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Badge variant="secondary" className="px-4 py-2 text-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors cursor-default">
                  {tech}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
