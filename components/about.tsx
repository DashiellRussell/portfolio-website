import { FadeIn, FadeInStagger, FadeInItem, ScaleOnHover } from "@/components/ui/motion-wrapper"

export function About() {
  const specialties = [
    {
      title: "Full-Stack Development",
      description:
        "Building scalable web applications with React, Next.js, and modern JavaScript frameworks and cloud infrastructure.",
    },
    {
      title: "Embedded Systems",
      description:
        "Designing and programming microcontroller-based solutions for real-world applications using Arduino, ESP32, and custom PCBs.",
    },
    {
      title: "Robotics Integration",
      description:
        "Creating intelligent systems that bridge software control with mechanical precision for robotics and automation.",
    },
    {
      title: "IoT Solutions",
      description:
        "Connecting devices and building secure communication protocols for distributed systems and smart applications.",
    },
  ]

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/50 overflow-hidden">
      <div className="container mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 uppercase tracking-tight">About Me</h2>
            <p className="text-xl text-foreground/70 font-medium">
              Engineering innovative solutions across hardware and software domains
            </p>
          </div>
        </FadeIn>

        <FadeInStagger>
          <div className="grid lg:grid-cols-2 gap-16">
            <FadeInItem className="space-y-6">
              <p className="text-lg text-foreground leading-relaxed font-medium">
                I'm a Mechatronics Engineering and Physics student at UNSW, driven by a passion for solving complex
                problems through innovation. Whether it's designing custom PCBs, developing full-stack web applications,
                or integrating sensors into robotics systems, I thrive on challenges that combine hardware and software to
                create impactful solutions.
              </p>
              <p className="text-lg text-foreground leading-relaxed font-medium">
                My work spans diverse projects—from leading the IT operations for UNSW's Robotics and Mechatronics Society
                to building IoT-enabled terrarium systems and developing real-time dashboards for robotics competitions. I
                believe in the power of technology to transform ideas into reality, and I'm always exploring new ways to
                push the boundaries of what's possible.
              </p>
              <p className="text-lg text-foreground leading-relaxed font-medium">
                When I'm not coding or soldering, you'll find me competing in robotics events, experimenting with new
                tech, or collaborating on projects that merge engineering with creativity. I'm excited about opportunities
                to work on innovative projects that make a real-world impact.
              </p>
            </FadeInItem>

            <FadeInItem className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-square border-[8px] border-border bg-card shadow-brutal-lg overflow-hidden group">
                <img
                  src="/about.jpg"
                  alt="About Dashiell"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </FadeInItem>
          </div>
        </FadeInStagger>

        <FadeInStagger>
          <div className="grid sm:grid-cols-2 gap-6 mt-16">
            {specialties.map((specialty, index) => (
              <FadeInItem key={index}>
                <ScaleOnHover className="h-full">
                  <div className="bg-card border-4 border-border p-6 shadow-brutal h-full hover:shadow-brutal-lg transition-all">
                    <div className="flex gap-4">
                      <div className="w-2 bg-accent flex-shrink-0" />
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground uppercase tracking-wide">{specialty.title}</h3>
                        <p className="text-foreground/70 leading-relaxed font-medium">{specialty.description}</p>
                      </div>
                    </div>
                  </div>
                </ScaleOnHover>
              </FadeInItem>
            ))}
          </div>
        </FadeInStagger>
      </div>
    </section>
  )
}
