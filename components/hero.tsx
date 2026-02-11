"use client"

import { Button } from "@/components/ui/button"
import { Download, ArrowRight, Move3d } from "lucide-react"
import Image from "next/image"
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/ui/motion-wrapper"
import { motion } from "framer-motion"
import { RobotArm } from "@/components/3d/robot-arm"

export function Hero() {
  const scrollToProjects = () => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="hero" className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto">
          <FadeInStagger delay={2.2}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
              <div className="space-y-8 flex-1 order-2 md:order-1">
                <FadeInItem>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber text-amber-foreground text-sm font-bold border-4 border-border shadow-brutal-sm uppercase">
                    <span className="w-3 h-3 bg-border rounded-full animate-pulse"></span>
                    Available for new projects
                  </div>
                </FadeInItem>

                <FadeInItem className="space-y-6">
                  <div className="border-l-[8px] border-accent pl-8">
                    <h1 className="text-5xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight">
                      Dashiell Russell
                    </h1>
                  </div>
                  <p className="text-xl text-foreground/70 leading-relaxed max-w-xl font-medium">
                    Mechatronics Engineering and Physics @ UNSW. Full-stack developer & embedded systems engineer building
                    intelligent solutions across hardware and software.
                  </p>
                </FadeInItem>

                <FadeInItem className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-accent text-accent-foreground hover:bg-accent flex-1 sm:flex-none"
                    onClick={scrollToProjects}
                  >
                    View Projects
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg" asChild className="flex-1 sm:flex-none bg-transparent">
                    <a href="/Dashiell Russell - Resume.pdf" download>
                      Download CV
                      <Download className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                </FadeInItem>
              </div>

              <FadeInItem className="order-1 md:order-2 flex flex-col items-center gap-4">
                <motion.div
                  className="relative w-80 h-96 flex-shrink-0 border-8 border-border shadow-brutal bg-card overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <RobotArm />
                </motion.div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground/50">
                  <Move3d className="w-4 h-4 animate-pulse" />
                  Interactive Model
                </div>
              </FadeInItem>
            </div>
          </FadeInStagger>

          <FadeIn delay={2.6}>
            <div className="flex flex-wrap gap-3 pt-12 max-w-6xl mx-auto">
              <span className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm hover:-translate-y-1 transition-transform cursor-default">
                Full-Stack Development
              </span>
              <span className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm hover:-translate-y-1 transition-transform cursor-default">
                Embedded Systems
              </span>
              <span className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm hover:-translate-y-1 transition-transform cursor-default">
                Robotics Integration
              </span>
              <span className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm hover:-translate-y-1 transition-transform cursor-default">
                IoT Solutions
              </span>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
