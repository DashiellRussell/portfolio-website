"use client"

import { Card } from "@/components/ui/card"
import { Code2, Cpu, CircuitBoard, Rocket } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: Code2,
    title: "Software Development",
    description: "Full-stack web development with React, Next.js, and modern JavaScript frameworks.",
  },
  {
    icon: CircuitBoard,
    title: "PCB Design",
    description: "Custom circuit board design and embedded systems for robotics and IoT projects.",
  },
  {
    icon: Cpu,
    title: "Robotics & Automation",
    description: "Building intelligent systems that combine mechanical, electrical, and software engineering.",
  },
  {
    icon: Rocket,
    title: "Innovation",
    description: "Rapidly prototyping ideas from concept to reality, bridging hardware and software.",
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">About Me</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Engineering innovative solutions across hardware and software domains
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative rounded-2xl overflow-hidden">
              <img src="/modern-office-developer.png" alt="Working environment" className="w-full h-auto" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-bold">Building at the Intersection of Hardware & Software</h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                As a Mechatronics Engineering student with a passion for Physics, I've developed a unique skill set that
                spans both the physical and digital worlds. My journey began with taking apart gadgets to understand how
                they work, which evolved into designing PCBs, building robots, and developing the software that brings
                them to life.
              </p>
              <p>
                I specialize in creating intelligent systems that require both hardware expertise and software finesse.
                Whether it's designing custom circuit boards, programming microcontrollers, or building full-stack web
                applications with React and Next.js, I thrive on projects that challenge me to think across disciplines.
              </p>
              <p>
                When I'm not in the lab or coding, you'll find me exploring new technologies, working on robotics
                competitions, or prototyping ideas that merge the physical and digital. I believe the most innovative
                solutions come from understanding both hardware constraints and software possibilities.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
