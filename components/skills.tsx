export function Skills() {
  const skillCategories = [
    {
      category: "Software Skills",
      skills: [
        { name: "React/Next.js", level: 90 },
        { name: "TypeScript/JavaScript", level: 85 },
        { name: "Python", level: 80 },
        { name: "C/C++", level: 75 },
      ],
    },
    {
      category: "Hardware & Electronics Skills",
      skills: [
        { name: "PCB Design (KiCAD/EasyEDA)", level: 80 },
        { name: "Arduino/ESP32", level: 90 },
        { name: "Soldering & Assembly", level: 85 },
        { name: "Circuit Design", level: 80 },
      ],
    },
    {
      category: "Robotics & Embedded Skills",
      skills: [
        { name: "Microcontroller Programming", level: 88 },
        { name: "Motor Control", level: 80 },
        { name: "ROS (Robot Operating System)", level: 70 },
        { name: "IoT Systems", level: 85 },
      ],
    },
  ]

  return (
    <section id="skills" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 uppercase tracking-tight">Skills & Expertise</h2>
          <p className="text-xl text-foreground/70 font-medium">Hardware, software, and everything in between</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {skillCategories.map((category, idx) => (
            <div key={idx} className="space-y-6">
              <h3 className="text-3xl font-bold text-foreground mb-6 uppercase tracking-wide">{category.category}</h3>
              <div className="space-y-6">
                {category.skills.map((skill, skillIdx) => (
                  <div key={skillIdx} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-foreground uppercase tracking-wide">{skill.name}</span>
                      <span className="text-base text-foreground font-bold font-mono bg-amber text-amber-foreground px-3 py-1 border-4 border-border">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-6 bg-background border-4 border-border overflow-hidden shadow-brutal-sm">
                      <div
                        className="h-full bg-accent border-r-4 border-border transition-all duration-1000 ease-out"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8 uppercase tracking-wide">Technologies I Work With</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "React",
              "Next.js",
              "TypeScript",
              "Python",
              "C/C++",
              "Arduino",
              "ESP32",
              "Raspberry Pi",
              "PCB Design",
              "KiCAD",
              "EasyEDA",
              "Fusion 360",
              "SolidWorks",
              "Git",
              "Node.js",
              "PostgreSQL",
              "Supabase",
              "WebSockets",
              "REST APIs",
              "Linux",
              "IoT",
              "Sensors",
              "3D Printing",
              "Docker",
              "n8n",
              "Caddy",
            ].map((tech, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-card text-foreground text-sm font-bold border-4 border-border uppercase tracking-wide shadow-brutal-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
