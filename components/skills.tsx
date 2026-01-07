"use client"

import { motion } from "framer-motion"
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/ui/motion-wrapper"

export function Skills() {
  const skillCategories = [
    {
      category: "Software Skills",
      skills: [
        { name: "React/Next.js", level: 90 },
        { name: "TypeScript/JavaScript", level: 85 },
        { name: "Python", level: 80 },
        { name: "C/C++", level: 75 },
      ],
    },
    {
      category: "Hardware & Electronics Skills",
      skills: [
        { name: "PCB Design (KiCAD/EasyEDA)", level: 80 },
        { name: "Arduino/ESP32", level: 90 },
        { name: "Soldering & Assembly", level: 85 },
        { name: "Circuit Design", level: 80 },
      ],
    },
    {
      category: "Robotics & Embedded Skills",
      skills: [
        { name: "Microcontroller Programming", level: 88 },
        { name: "Motor Control", level: 80 },
        { name: "ROS (Robot Operating System)", level: 70 },
        { name: "IoT Systems", level: 85 },
      ],
    },
  ]

  return (
    <section id="skills" className="py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="container mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 uppercase tracking-tight">Skills & Expertise</h2>
            <p className="text-xl text-foreground/70 font-medium">Hardware, software, and everything in between</p>
          </div>
        </FadeIn>

        <FadeInStagger className="max-w-4xl mx-auto space-y-12">
          {skillCategories.map((category, idx) => (
            <FadeInItem key={idx} className="space-y-6">
              <h3 className="text-3xl font-bold text-foreground mb-6 uppercase tracking-wide">{category.category}</h3>
              <div className="space-y-6">
                {category.skills.map((skill, skillIdx) => (
                  <div key={skillIdx} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-foreground uppercase tracking-wide">{skill.name}</span>
                      <span className="text-base text-foreground font-bold font-mono bg-amber text-amber-foreground px-3 py-1 border-4 border-border">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-6 bg-background border-4 border-border overflow-hidden shadow-brutal-sm">
                      <motion.div
                        className="h-full bg-accent border-r-4 border-border"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>

        <FadeIn delay={0.2}>
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-8 uppercase tracking-wide">Technologies I Work With</h3>
            <FadeInStagger className="flex flex-wrap justify-center gap-3">
              {[
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
                "EasyEDA",
                "Fusion 360",
                "SolidWorks",
                "Git",
                "Node.js",
                "PostgreSQL",
                "Supabase",
                "WebSockets",
                "REST APIs",
                "Linux",
                "IoT",
                "Sensors",
                "3D Printing",
                "Docker",
                "n8n",
                "Caddy",
              ].map((tech, idx) => (
                <FadeInItem key={idx}>
                  <motion.div
                    className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm cursor-default"
                    whileHover={{ scale: 1.1, rotate: Math.random() * 4 - 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {tech}
                  </motion.div>
                </FadeInItem>
              ))}
            </FadeInStagger>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
