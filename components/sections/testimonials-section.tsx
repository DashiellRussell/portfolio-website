"use client"

import { Quote } from "lucide-react"
import { motion } from "framer-motion"

const testimonials = [
  {
    content: "Dashiell is a rare talent who truly understands both hardware and software. His work on our IoT infrastructure was nothing short of exceptional.",
    author: "Sarah Chen",
    role: "CTO at TechFlow",
    image: "/placeholder-user.jpg"
  },
  {
    content: "The attention to detail and performance optimization Dashiell brings to web projects is outstanding. He delivered our platform ahead of schedule.",
    author: "Michael Ross",
    role: "Product Manager",
    image: "/placeholder-user.jpg"
  },
  {
    content: "An incredible problem solver. He took our complex requirements and turned them into a seamless, user-friendly experience.",
    author: "Jessica Wong",
    role: "Lead Engineer",
    image: "/placeholder-user.jpg"
  }
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(var(--primary),0.05),transparent_50%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              What People Say
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300"
            >
              <Quote className="absolute top-8 right-8 h-8 w-8 text-primary/20" />

              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20">
                    <img
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-primary">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
