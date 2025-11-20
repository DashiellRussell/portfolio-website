import { Github, Instagram, Linkedin, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-white/10 pt-16 pb-8 overflow-hidden bg-background/80 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary),0.1),transparent_50%)]" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Dashiell Russell
            </h3>
            <p className="text-muted-foreground max-w-md leading-relaxed text-lg">
              Full-Stack Developer bridging the gap between hardware and software.
              Crafting digital experiences that matter.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Github, href: "https://github.com/DashiellRussell", label: "GitHub" },
                { icon: Linkedin, href: "https://www.linkedin.com/in/dashiell-russell-9973482a1", label: "LinkedIn" },
                { icon: Instagram, href: "https://www.instagram.com/dashiell_russell/", label: "Instagram" },
                { icon: Mail, href: "mailto:dashiell.russell@gmail.com", label: "Email" }
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 hover:scale-110 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] flex items-center justify-center transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-6 text-lg text-foreground">Quick Links</h4>
            <ul className="space-y-4">
              {["Home", "About", "Skills", "Projects", "Experience"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-300 inline-block"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-6 text-lg text-foreground">Contact</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Sydney, Australia
              </li>
              <li>
                <a href="mailto:dashiell.russell@gmail.com" className="hover:text-primary transition-colors">
                  dashiell.russell@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+61435554607" className="hover:text-primary transition-colors">
                  +61 435-554-607
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© {currentYear} Dashiell Russell. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
