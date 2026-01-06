import { Github, Linkedin, Instagram, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const links = {
    navigation: [
      { label: "Home", href: "/#home" },
      { label: "About", href: "/#about" },
      { label: "Skills", href: "/#skills" },
      { label: "Projects", href: "/#projects" },
      { label: "Experience", href: "/#experience" },
    ],
    contact: [
      { label: "Sydney, Australia", href: "#", icon: null },
      { label: "dashiell.russell@gmail.com", href: "mailto:dashiell.russell@gmail.com", icon: null },
      { label: "+61 435-554-607", href: "tel:+61435554607", icon: null },
    ],
  }

  return (
    <footer className="bg-foreground text-background py-16 px-4 sm:px-6 lg:px-8 border-t-8 border-accent">
      <div className="container mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-3xl font-bold tracking-tight uppercase">Dashiell Russell</h3>
            <p className="text-sm text-background/80 leading-relaxed font-medium">
              Full-Stack Developer bridging the gap between hardware and software. Crafting digital experiences that
              matter.
            </p>
            <div className="flex gap-4 pt-4">
              <a
                href="https://github.com/DashiellRussell"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-4 border-background/20 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-accent-foreground transition-all"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/dashiell-russell-9973482a1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-4 border-background/20 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-accent-foreground transition-all"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/dashiell_russell/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-4 border-background/20 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-accent-foreground transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:dashiell.russell@gmail.com"
                className="w-10 h-10 border-4 border-background/20 flex items-center justify-center hover:bg-accent hover:border-accent hover:text-accent-foreground transition-all"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {links.navigation.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-background/80 hover:text-accent transition-colors font-bold uppercase tracking-wide"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2">
              {links.contact.map((link, idx) => (
                <li key={idx}>
                  {link.href.startsWith("#") ? (
                    <span className="text-sm text-background/80 font-medium">{link.label}</span>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-background/80 hover:text-accent transition-colors font-medium"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t-4 border-background/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-background/80 font-bold uppercase tracking-wide">
              © {currentYear} Dashiell Russell. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="/#"
                className="text-sm text-background/80 hover:text-accent transition-colors font-bold uppercase tracking-wide"
              >
                Privacy Policy
              </a>
              <a
                href="/#"
                className="text-sm text-background/80 hover:text-accent transition-colors font-bold uppercase tracking-wide"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
