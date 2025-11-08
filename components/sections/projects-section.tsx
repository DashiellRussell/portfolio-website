"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github } from "lucide-react"
import { motion } from "framer-motion"

const projects = [
  {
    title: "E-Commerce Platform",
    description:
      "A full-featured e-commerce platform with product management, shopping cart, payment integration, and admin dashboard. Built with Next.js and Stripe.",
    image: "/ecommerce-platform-dashboard.jpg",
    tags: ["Next.js", "TypeScript", "Stripe", "PostgreSQL"],
    liveUrl: "#",
    githubUrl: "#",
    featured: true,
  },
  {
    title: "Task Management App",
    description:
      "Collaborative task management application with real-time updates, team workspaces, and project tracking. Features drag-and-drop interface.",
    image: "/task-management-interface.jpg",
    tags: ["React", "Node.js", "Socket.io", "MongoDB"],
    liveUrl: "#",
    githubUrl: "#",
    featured: true,
  },
  {
    title: "AI Content Generator",
    description:
      "AI-powered content generation tool that helps create blog posts, social media content, and marketing copy using advanced language models.",
    image: "/ai-content-generator-ui.jpg",
    tags: ["Next.js", "OpenAI", "Tailwind", "Supabase"],
    liveUrl: "#",
    githubUrl: "#",
    featured: true,
  },
  {
    title: "Weather Dashboard",
    description:
      "Beautiful weather dashboard with forecasts, interactive maps, and location-based alerts. Responsive design for all devices.",
    image: "/weather-dashboard-app.jpg",
    tags: ["React", "Weather API", "Charts", "CSS"],
    liveUrl: "#",
    githubUrl: "#",
    featured: false,
  },
  {
    title: "Portfolio CMS",
    description:
      "Headless CMS for managing portfolio content with a modern admin interface. Supports markdown, media uploads, and SEO optimization.",
    image: "/portfolio-cms-admin.jpg",
    tags: ["Next.js", "Prisma", "PostgreSQL", "AWS S3"],
    liveUrl: "#",
    githubUrl: "#",
    featured: false,
  },
  {
    title: "Fitness Tracker",
    description:
      "Mobile-first fitness tracking app with workout logging, progress charts, and personalized recommendations based on user goals.",
    image: "/fitness-tracker-mobile.jpg",
    tags: ["React Native", "Firebase", "Redux", "Charts"],
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
            A selection of my recent work and side projects
          </p>
        </motion.div>

        <div className="grid gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all hover:border-primary/30 group">
                <div className={`grid ${project.featured ? "md:grid-cols-2" : "md:grid-cols-5"} gap-0`}>
                  {/* Image */}
                  <div className={project.featured ? "md:col-span-1" : "md:col-span-2"}>
                    <div className="relative aspect-video md:aspect-square h-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                      <img
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {project.featured && (
                        <div className="absolute top-4 right-4 z-20">
                          <Badge className="bg-gradient-to-r from-primary to-accent text-white shadow-lg">Featured</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`p-6 flex flex-col justify-between ${project.featured ? "md:col-span-1" : "md:col-span-3"}`}
                  >
                    <div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{project.title}</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.tags.map((tag, tagIndex) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-colors"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="default" size="sm" asChild>
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Live Demo
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="mr-2 h-4 w-4" />
                          Code
                        </a>
                      </Button>
                    </div>
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
