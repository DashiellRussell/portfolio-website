"use client"

import { Button } from "@/components/ui/button"
import { Download, ArrowRight } from "lucide-react"
import Image from "next/image"

export function Hero() {
  const scrollToProjects = () => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="hero" className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
            <div className="space-y-8 flex-1 order-2 md:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber text-amber-foreground text-sm font-bold border-4 border-border shadow-brutal-sm uppercase">
                <span className="w-3 h-3 bg-border rounded-full animate-pulse"></span>
                Available for new projects
              </div>

              <div className="space-y-6">
                <div className="border-l-[8px] border-accent pl-8">
                  <h1 className="text-5xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight">
                    Dashiell Russell
                  </h1>
                </div>
                <p className="text-xl text-foreground/70 leading-relaxed max-w-xl font-medium">
                  Mechatronics Engineering and Physics @ UNSW. Full-stack developer & embedded systems engineer building
                  intelligent solutions across hardware and software.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent flex-1 sm:flex-none"
                  onClick={scrollToProjects}
                >
                  View Projects
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" asChild className="flex-1 sm:flex-none bg-transparent">
                  <a href="/Dashiell-Russell-Resume.pdf" download>
                    Download CV
                    <Download className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="relative w-80 h-80 flex-shrink-0 border-8 border-border shadow-brutal bg-card order-1 md:order-2">
              <Image src="/profile-pic.jpeg" alt="Dashiell Russell" fill className="object-cover" priority />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-12 max-w-6xl mx-auto">
            <span className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm">
              Full-Stack Development
            </span>
            <span className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm">
              Embedded Systems
            </span>
            <span className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm">
              Robotics Integration
            </span>
            <span className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm">
              IoT Solutions
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
