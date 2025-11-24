import { projects } from "@/lib/data"
import { ProjectCard } from "@/components/project-card"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProjectsPage() {
    return (
        <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary flex flex-col">
            <Navigation />

            <main className="flex-1 pt-32 pb-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12">
                        <Button variant="ghost" size="sm" className="mb-6 pl-0 hover:bg-transparent hover:text-primary" asChild>
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>

                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                All Projects
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            A comprehensive collection of my work across full-stack development, embedded systems, and robotics engineering.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((project) => (
                            <div key={project.title} className="h-full">
                                <ProjectCard project={project} />
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
