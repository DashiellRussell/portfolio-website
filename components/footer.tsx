import { Github, Instagram, Linkedin, Mail, Twitter } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-3">Dashiell Russell</h3>
            <p className="text-muted-foreground mb-4 max-w-md leading-relaxed">
              Full-Stack Developer passionate about creating beautiful, performant web experiences. Let's build
              something amazing together.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/DashiellRussell"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg border hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/dashiell-russell-9973482a1"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg border hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/dashiell_russell/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg border hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:dashiell.russell@gmail.com"
                className="h-10 w-10 rounded-lg border hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#home" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#skills" className="text-muted-foreground hover:text-foreground transition-colors">
                  Skills
                </a>
              </li>
              <li>
                <a href="#projects" className="text-muted-foreground hover:text-foreground transition-colors">
                  Projects
                </a>
              </li>
              <li>
                <a href="#experience" className="text-muted-foreground hover:text-foreground transition-colors">
                  Experience
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Sydney, Au</li>
              <li>
                <a href="mailto:dashiell.russell@gmail.com" className="hover:text-foreground transition-colors">
                  dashiell.russell@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+61435554607" className="hover:text-foreground transition-colors">
                  +61 435-554-607
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© {currentYear} Dashiell Russell. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
