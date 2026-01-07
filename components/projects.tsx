"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ExternalLink, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { FadeIn } from "@/components/ui/motion-wrapper"

export function Projects() {
  const [currentProject, setCurrentProject] = useState(0)

  const projects = [
    {
      title: "Ramsoc UNSW Website",
      status: "Featured",
      description:
        "Professional website for UNSW Robotics and Mechatronics Society. Features event dashboards, competition showcases (Sumobots, Arcade Workshop), and custom animations. Built with accessibility and dark mode support.",
      tags: ["Next.js", "Tailwind CSS", "shadcn/ui", "React"],
      image: "/ramsocunsw.png",
      liveUrl: "https://ramsoc.unsw.edu.au/",
      codeUrl: "https://github.com/UNSW-Robotics-and-Mechatronics-Society/ramsoc-website",
    },
    {
      title: "Bicycles2U Website",
      status: "Featured",
      description:
        "Full-stack e-commerce website for premium bicycle shop. Features bike sizing calculator, sell bike form, service booking system, and interactive testimonials. Built with Material-UI and professional refurbished bikes from Sydney's first and only bike store dedicated to Pre-Owned and professionally refurbished Road, Triathlon and E-Bike bikes.",
      tags: ["Next.js 15", "React 19", "Material-UI", "TypeScript", "Tailwind v4"],
      image: "/b2u.png",
      liveUrl: "https://www.bicycles2u.com.au/",
      codeUrl: "https://github.com/bicyclerepairs2u-create/bycicles2u-website",
    },
    {
      title: "Pickabots - Live Match Dashboard",
      status: "Featured",
      description:
        "Real-time match dashboard and betting interface for robotics competitions. Features WebSocket communication for live telemetry updates, synchronized betting system using Supabase, and real-time score tracking.",
      tags: ["Next.js", "Supabase", "WebSockets", "Chakra UI", "PostgreSQL"],
      image: "/pickabots.png",
      liveUrl: "https://pickabots.ramsocunsw.org/",
      codeUrl: "https://github.com/UNSW-Robotics-and-Mechatronics-Society/pick-a-bot-2025",
    },
    {
      title: "NFC Smart Business Card",
      status: "In Development",
      description:
        "Custom-designed PCB business card with integrated NFC chip for instant contact sharing. Ultra-thin form factor with optimized antenna design and tuned layout for reliable NFC performance.",
      tags: ["PCB Design", "NFC", "Easy Eda", "Antenna Design", "PCB Manufacturing"],
      image: "/pcb-card.png",
      liveUrl: null,
      codeUrl: null,
    },
    {
      title: "Automated Terrarium System",
      status: "In Development",
      description:
        "IoT-enabled automated growing system designed to tackle global hunger by enabling food cultivation anywhere. Features climate control, automated watering, intelligent grow lights, remote monitoring via mobile app, and AI-powered plant health analysis to optimize growing conditions.",
      tags: ["Arduino", "IoT", "Sensors", "Automation", "AI"],
      image: "/automated-smart-terrarium-iot-system.jpg",
      liveUrl: null,
      codeUrl: null,
    },
  ]

  const nextProject = () => {
    setCurrentProject((prev) => (prev + 1) % projects.length)
  }

  const prevProject = () => {
    setCurrentProject((prev) => (prev - 1 + projects.length) % projects.length)
  }

  const project = projects[currentProject]

  return (
    <section id="projects" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/50 overflow-hidden">
      <div className="container mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 uppercase tracking-tight">Featured Projects</h2>
            <p className="text-xl text-foreground/70 font-medium">
              A selection of my recent work in robotics, web development, and hardware engineering.
            </p>
          </div>
        </FadeIn>

        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProject}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="bg-card border-4 border-border overflow-hidden shadow-brutal-lg min-h-[600px] flex flex-col"
            >
              {project.status && (
                <div className="bg-accent text-accent-foreground px-4 py-2 text-sm font-bold uppercase tracking-wide border-b-4 border-border">
                  {project.status}
                </div>
              )}

              <div className="aspect-video bg-muted relative border-b-4 border-border overflow-hidden">
                <motion.img
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="p-8 space-y-6 flex-1 flex flex-col">
                <div className="min-h-[200px] flex flex-col">
                  <h3 className="text-4xl font-bold text-foreground mb-4 uppercase tracking-tight">{project.title}</h3>
                  <p className="text-lg text-foreground/70 leading-relaxed font-medium">{project.description}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-accent text-accent-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  {project.liveUrl ? (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline flex items-center gap-2 font-bold uppercase tracking-wide"
                    >
                      <ExternalLink className="h-5 w-5" />
                      View Project
                    </a>
                  ) : (
                    <span className="text-foreground/50 flex items-center gap-2 font-bold uppercase tracking-wide">
                      <ExternalLink className="h-5 w-5" />
                      Coming Soon
                    </span>
                  )}
                  {project.codeUrl ? (
                    <a
                      href={project.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline flex items-center gap-2 font-bold uppercase tracking-wide"
                    >
                      <Github className="h-5 w-5" />
                      View Code
                    </a>
                  ) : (
                    <span className="text-foreground/50 flex items-center gap-2 font-bold uppercase tracking-wide">
                      <Github className="h-5 w-5" />
                      Private
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            <Button variant="outline" size="icon" onClick={prevProject}>
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div className="flex gap-3">
              {projects.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentProject(idx)}
                  className={`w-4 h-4 border-4 border-border transition-all shadow-brutal-sm ${
                    idx === currentProject ? "bg-accent" : "bg-background"
                  }`}
                  aria-label={`Go to project ${idx + 1}`}
                />
              ))}
            </div>

            <Button variant="outline" size="icon" onClick={nextProject}>
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
