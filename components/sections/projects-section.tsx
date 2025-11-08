"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github } from "lucide-react"
import { motion } from "framer-motion"

const projects = [
  {
    title: "Ramsoc UNSW Website",
    description:
      "Professional website for UNSW Robotics and Mechatronics Society. Features event dashboards, competition showcases (Sumobots, Arcade Workshop), and custom animations. Built with modern dark theme and accessibility in mind.",
    image: "/ramsocunsw.png",
    tags: ["Next.js", "Tailwind CSS", "shadcn/ui", "React"],
    liveUrl: "https://ramsoc.unsw.edu.au",
    githubUrl: "https://github.com/UNSW-Robotics-and-Mechatronics-Society/ramsoc-website",
    featured: true,
  },
  {
    title: "Bicycles2U Website",
    description:
      "Full-stack e-commerce website for premium bicycle shop. Features bike sizing calculator, sell bike form, service booking system, and interactive testimonials. Built with Material-UI and shadcn/ui component libraries.",
    image: "/b2u.png",
    tags: ["Next.js 15", "React 19", "Material-UI", "TypeScript", "Tailwind v4"],
    liveUrl: "https://www.bicycles2u.com.au/",
    githubUrl: "https://github.com/bicyclerepairs2u-create/bycicles2u-website",
    featured: true,
  },
  {
    title: "Pickabots - Live Match Dashboard",
    description:
      "Real-time match dashboard and betting interface for robotics competitions. Features WebSocket communication, live telemetry, and synchronized betting system for Sumo Bot matches with Supabase backend.",
    image: "/pickabots.png",
    tags: ["Next.js", "Supabase", "WebSockets", "Chakra UI", "PostgreSQL"],
    liveUrl: "https://pickabots.ramsocunsw.org/",
    githubUrl: "https://github.com/UNSW-Robotics-and-Mechatronics-Society/pick-a-bot-2025",
    featured: true,
  },
  {
    title: "NFC Smart Business Card",
    description:
      "Custom-designed PCB business card with integrated NFC chip for instant contact sharing. Ultra-thin form factor with creative circuit art design. Demonstrates advanced PCB layout and NFC antenna tuning.",
    image: "/pcb-card.png",
    tags: ["PCB Design", "NFC", "Easy Eda", "Antenna Design", "PCB Manufacturing"],
    liveUrl: "#",
    githubUrl: "#",
    featured: false,
  },
  {
    title: "Automated Terrarium System",
    description:
      "IoT-enabled automated growing system designed to tackle global hunger by enabling food cultivation anywhere. Features climate control, automated watering, LED grow lights, and remote monitoring for optimal plant growth.",
    image: "/terrarium.png",
    tags: ["Arduino", "IoT", "Sensors", "Automation", "AI"],
    liveUrl: "#",
    githubUrl: "#",
    featured: false,
  },
  {
    title: "ACE Defense AI Infrastructure",
    description:
      "National defense case competition proposal for AI-driven military infrastructure management. Digital twin technology with predictive maintenance, resource optimization, and real-time scenario planning. 10-year phased implementation targeting 40% efficiency gains.",
    image: "/case.png",
    tags: ["AI Strategy", "Digital Twin", "Case Competition", "Systems Design"],
    liveUrl: "#",
    githubUrl: "#",
    featured: false,
  },
]

export function ProjectsSection() {
  return (
    <section id="projects" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Projects</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Hardware, software, and robotics projects showcasing end-to-end development
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all hover:border-primary/30 group h-full flex flex-col">
                {/* Image */}
                <div className="relative aspect-video overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                  <img
                    src={project.image || "/placeholder.svg"}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {project.featured && (
                    <div className="absolute top-3 right-3 z-20">
                      <Badge className="bg-gradient-to-r from-primary to-accent text-white shadow-lg text-xs">
                        Featured
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-3 flex-grow">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-colors"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    {project.liveUrl !== "#" ? (
                      <Button variant="default" size="sm" className="flex-1 text-xs h-8" asChild>
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-3 w-3" />
                          View
                        </a>
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" className="flex-1 text-xs h-8" disabled>
                        <ExternalLink className="mr-1.5 h-3 w-3" />
                        View
                      </Button>
                    )}
                    {project.githubUrl !== "#" ? (
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="mr-1.5 h-3 w-3" />
                          Code
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" disabled>
                        <Github className="mr-1.5 h-3 w-3" />
                        Code
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
