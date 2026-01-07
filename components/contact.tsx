"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Linkedin, Github, Instagram, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/ui/motion-wrapper"

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { name, email, subject, message } = formData
    const mailtoLink = `mailto:dashiell.russell@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    )}`
    window.location.href = mailtoLink
  }

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/50 overflow-hidden">
      <div className="container mx-auto max-w-4xl">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 uppercase tracking-tight">Get In Touch</h2>
            <p className="text-xl text-foreground/70 font-medium">
              Have a project in mind? Let's work together to create something amazing
            </p>
          </div>
        </FadeIn>

        <FadeInStagger className="grid md:grid-cols-2 gap-12 mb-12">
          <FadeInItem className="space-y-8">
            <div className="bg-card border-4 border-border p-6 shadow-brutal">
              <h3 className="text-2xl font-bold mb-6 uppercase tracking-wide">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sm mb-1">Email</p>
                    <a
                      href="mailto:dashiell.russell@gmail.com"
                      className="text-foreground/70 hover:text-accent transition-colors font-medium"
                    >
                      dashiell.russell@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sm mb-1">Phone</p>
                    <a
                      href="tel:+61435554607"
                      className="text-foreground/70 hover:text-accent transition-colors font-medium"
                    >
                      +61 435 554 607
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold uppercase tracking-wide text-sm mb-1">Location</p>
                    <p className="text-foreground/70 font-medium">Sydney, Australia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border-4 border-border p-6 shadow-brutal">
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wide">Let's Connect</h3>
              <p className="text-foreground/70 leading-relaxed mb-6 font-medium">
                I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
              </p>
              <div className="flex gap-4">
                <motion.a
                  href="https://github.com/DashiellRussell"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 border-4 border-border flex items-center justify-center shadow-brutal hover:shadow-brutal-lg hover:bg-accent hover:text-accent-foreground transition-all"
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Github className="h-5 w-5" />
                </motion.a>
                <motion.a
                  href="https://www.linkedin.com/in/dashiell-russell-9973482a1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 border-4 border-border flex items-center justify-center shadow-brutal hover:shadow-brutal-lg hover:bg-accent hover:text-accent-foreground transition-all"
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Linkedin className="h-5 w-5" />
                </motion.a>
                <motion.a
                  href="https://www.instagram.com/dashiell_russell/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 border-4 border-border flex items-center justify-center shadow-brutal hover:shadow-brutal-lg hover:bg-accent hover:text-accent-foreground transition-all"
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Instagram className="h-5 w-5" />
                </motion.a>
              </div>
            </div>
          </FadeInItem>

          <FadeInItem>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold mb-3 uppercase tracking-wide">
                  Name
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold mb-3 uppercase tracking-wide">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-bold mb-3 uppercase tracking-wide">
                  Subject
                </label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="What's this about?"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-bold mb-3 uppercase tracking-wide">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell me about your project..."
                  required
                  rows={6}
                />
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent">
                  Send Message
                </Button>
              </motion.div>
            </form>
          </FadeInItem>
        </FadeInStagger>
      </div>
    </section>
  )
}
