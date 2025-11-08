"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github } from "lucide-react"
import { motion } from "framer-motion"

const projects = [
  {
    title: "Autonomous Line-Following Robot",
    description:
      "Built a custom PCB-based robot with PID control algorithms for precise line tracking. Features IR sensor array, motor drivers, and ESP32 microcontroller. Competed in university robotics competition.",
    image: "/ecommerce-platform-dashboard.jpg",
    tags: ["PCB Design", "ESP32", "C++", "PID Control", "KiCAD"],
    liveUrl: "#",
    githubUrl: "#",
    featured: true,
  },
  {
    title: "IoT Environmental Monitor",
    description:
      "Designed and manufactured custom PCB for multi-sensor environmental monitoring system. Real-time data visualization web dashboard with Next.js. Tracks temperature, humidity, air quality, and more.",
    image: "/task-management-interface.jpg",
    tags: ["PCB Design", "Arduino", "React", "Next.js", "MQTT"],
    liveUrl: "#",
    githubUrl: "#",
    featured: true,
  },
  {
    title: "Robotic Arm Control System",
    description:
      "6-axis robotic arm with custom inverse kinematics solver. Built control interface using React and communicates with Arduino via serial. Features path planning and object detection using OpenCV.",
    image: "/ai-content-generator-ui.jpg",
    tags: ["ROS", "Python", "OpenCV", "Arduino", "React"],
    liveUrl: "#",
    githubUrl: "#",
    featured: true,
  },
  {
    title: "Smart Home Automation Hub",
    description:
      "Centralized home automation system with custom PCB design. Controls lights, temperature, and security systems. Web interface built with Next.js and mobile app integration.",
    image: "/weather-dashboard-app.jpg",
    tags: ["ESP32", "Next.js", "PCB Design", "MQTT", "TypeScript"],
    liveUrl: "#",
    githubUrl: "#",
    featured: false,
  },
  {
    title: "E-Commerce Platform",
    description:
      "Full-stack e-commerce platform with product management, shopping cart, payment integration via Stripe, and admin dashboard. Optimized for performance and SEO.",
    image: "/portfolio-cms-admin.jpg",
    tags: ["Next.js", "TypeScript", "Stripe", "PostgreSQL"],
    liveUrl: "#",
    githubUrl: "#",
    featured: false,
  },
  {
    title: "Custom Drone Flight Controller",
    description:
      "Designed custom flight controller PCB with IMU sensor fusion and PID control. Implemented stabilization algorithms and telemetry system for real-time flight data monitoring.",
    image: "/fitness-tracker-mobile.jpg",
    tags: ["PCB Design", "C/C++", "IMU", "PID", "Telemetry"],
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
