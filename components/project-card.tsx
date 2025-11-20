"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github } from "lucide-react"

interface ProjectCardProps {
    project: {
        title: string
        description: string
        image: string
        tags: string[]
        liveUrl: string
        githubUrl: string
        featured: boolean
    }
}

export function ProjectCard({ project }: ProjectCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all hover:border-primary/30 group h-full flex flex-col bg-card/50 backdrop-blur-sm">
            {/* Image */}
            <div className="relative aspect-video overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <img
                    src={project.image || "/placeholder.svg"}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {project.featured && (
                    <div className="absolute top-3 right-3 z-20">
                        <Badge className="bg-gradient-to-r from-primary to-accent text-white shadow-lg text-xs border-none">
                            Featured
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {project.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3 flex-grow">
                    {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                    {project.tags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-colors bg-primary/5"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex gap-2 mt-auto">
                    {project.liveUrl !== "#" ? (
                        <Button variant="default" size="sm" className="flex-1 text-xs h-8" asChild>
                            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1.5 h-3 w-3" />
                                View
                            </a>
                        </Button>
                    ) : (
                        <Button variant="default" size="sm" className="flex-1 text-xs h-8" disabled>
                            <ExternalLink className="mr-1.5 h-3 w-3" />
                            View
                        </Button>
                    )}
                    {project.githubUrl !== "#" ? (
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                <Github className="mr-1.5 h-3 w-3" />
                                Code
                            </a>
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" disabled>
                            <Github className="mr-1.5 h-3 w-3" />
                            Code
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    )
}
