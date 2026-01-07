import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Skills } from "@/components/skills"
import { Insights } from "@/components/insights"
import { Projects } from "@/components/projects"
import { Experience } from "@/components/experience"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Preloader } from "@/components/preloader"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Preloader />
      <Header />
      <Hero />
      <About />
      <Skills />
      <Insights />
      <Projects />
      <Experience />
      <Contact />
      <Footer />
    </main>
  )
}
