"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Github, Star, Code } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { getGithubRepos, type GithubRepo } from "@/lib/github"
import { BlogModal } from "@/components/blog-modal"

export function BlogSection() {
    const [repos, setRepos] = useState<GithubRepo[]>([])
    const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        async function fetchRepos() {
            const data = await getGithubRepos("DashiellRussell")
            setRepos(data)
        }
        fetchRepos()
    }, [])

    const handleReadMore = (repo: GithubRepo) => {
        setSelectedRepo(repo)
        setIsModalOpen(true)
    }

    return (
        <section id="blog" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16 space-y-4"
                >
                    <h2 className="text-3xl md:text-4xl font-bold">
                        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            Latest Insights & Code
                        </span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Exploring engineering challenges through open source. Click on a project to read its documentation.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {repos.map((repo, index) => (
                        <motion.div
                            key={repo.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            onClick={() => handleReadMore(repo)}
                            className="group relative bg-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/50 transition-colors duration-300 flex flex-col cursor-pointer"
                        >
                            <div className="p-6 flex-1 flex flex-col space-y-4">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Code className="h-3 w-3" />
                                        {repo.language || "Code"}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 text-yellow-500" />
                                        {repo.stargazers_count}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
                                    {repo.name}
                                </h3>

                                <p className="text-muted-foreground text-sm line-clamp-3 flex-1">
                                    {repo.description || "No description available."}
                                </p>

                                <div className="pt-4 flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        className="p-0 h-auto hover:bg-transparent hover:text-primary group/btn"
                                    >
                                        Read Article
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                    </Button>
                                    <a
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Github className="h-5 w-5" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <BlogModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                repo={selectedRepo ? { ...selectedRepo, owner: { login: "DashiellRussell" } } : null}
            />
        </section>
    )
}
