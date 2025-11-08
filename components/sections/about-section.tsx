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
            <div className="relative rounded-2xl overflow-hidden max-w-2xl mx-auto aspect-[4/3]">
              <img src="/about.jpg" alt="Working environment" className="w-full h-full object-cover" />
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
              <p> I’m studying Mechatronics Engineering and Physics, combining a passion for building things with a curiosity for how they work. What started with taking apart gadgets has grown into designing PCBs, developing robots, and writing the software that brings them to life. </p> 
              <p> My work focuses on creating intelligent systems that bridge hardware and software. From custom circuit design and microcontroller programming to full-stack web applications built with React and Next.js. I enjoy projects that challenge me to think across disciplines and connect theory with real-world application. </p> 
              <p> Outside of classes and projects, I’m often exploring new technologies, competing in robotics events, or prototyping ideas that merge engineering and physics in creative ways. </p>
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
