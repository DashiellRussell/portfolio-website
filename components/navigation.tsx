"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, Download, Github, Linkedin, Instagram, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Projects", href: "#projects" },
  { name: "Experience", href: "#experience" },
  { name: "Skills", href: "#skills" },
  { name: "Contact", href: "#contact" },
]

const socialLinks = [
  { icon: Github, href: "https://github.com/DashiellRussell", label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/dashiell-russell-9973482a1", label: "LinkedIn" },
  { icon: Instagram, href: "https://www.instagram.com/dashiell_russell/", label: "Instagram" },
  { icon: Mail, href: "mailto:dashiell.russell@gmail.com", label: "Email" },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-primary/5"
          : "bg-transparent",
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="#home" className="flex items-center space-x-2 group relative z-50">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient group-hover:scale-105 transition-transform duration-300">
              DR
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 bg-background/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-all rounded-full hover:bg-primary/10 relative group"
              >
                {item.name}
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary group-hover:w-1/2 transition-all duration-300 shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-1 border-r border-white/10 pr-3 mr-1">
              {socialLinks.map((social) => (
                <Button key={social.label} variant="ghost" size="icon" asChild className="h-9 w-9 hover:text-primary hover:bg-primary/10 transition-colors">
                  <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
            <ThemeToggle />
            <Button size="sm" className="ml-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all duration-300" asChild>
              <a href="/Dashiell-Russell-Resume.pdf" target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Resume
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="relative z-50">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl lg:hidden flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="flex flex-col items-center space-y-6 w-full max-w-xs">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-medium text-foreground/80 hover:text-primary hover:scale-110 transition-all duration-300"
                >
                  {item.name}
                </Link>
              ))}

              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

              <div className="flex items-center justify-center space-x-4">
                {socialLinks.map((social) => (
                  <Button key={social.label} variant="ghost" size="icon" asChild className="h-10 w-10 hover:text-primary hover:bg-primary/10">
                    <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                      <social.icon className="h-5 w-5" />
                    </a>
                  </Button>
                ))}
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)]" asChild>
                <a href="/Dashiell-Russell-Resume.pdf" target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Resume
                </a>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
