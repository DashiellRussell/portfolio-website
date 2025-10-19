"use client"

import { Card } from "@/components/ui/card"
import { Code2, Palette, Rocket, Users } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: Code2,
    title: "Clean Code",
    description: "Writing maintainable, scalable code following best practices and design patterns.",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "Creating intuitive interfaces with attention to detail and user experience.",
  },
  {
    icon: Rocket,
    title: "Performance",
    description: "Optimizing applications for speed, efficiency, and seamless user interactions.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Working effectively with teams to deliver projects on time and exceed expectations.",
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
            Passionate about creating digital experiences that make a difference
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
            <h3 className="text-3xl font-bold">Crafting Digital Solutions</h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                With over 5 years of experience in web development, I've had the privilege of working with startups and
                established companies to bring their visions to life. My journey began with a curiosity about how
                websites work, which evolved into a passion for creating seamless digital experiences.
              </p>
              <p>
                I specialize in modern JavaScript frameworks, particularly React and Next.js, and I'm constantly
                exploring new technologies to stay at the forefront of web development. My approach combines technical
                expertise with creative problem-solving to deliver solutions that not only work flawlessly but also
                delight users.
              </p>
              <p>
                When I'm not coding, you'll find me contributing to open-source projects, writing technical articles, or
                mentoring aspiring developers. I believe in continuous learning and sharing knowledge with the
                community.
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
