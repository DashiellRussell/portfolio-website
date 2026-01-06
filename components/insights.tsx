"use client"

import { Star, Github, BookOpen, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"

interface GitHubRepo {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  html_url: string
}

export function Insights() {
  const [repositories, setRepositories] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch("https://api.github.com/users/DashiellRussell/repos?sort=updated&per_page=6")
        if (response.ok) {
          const data = await response.json()
          setRepositories(data)
          console.log("[v0] Got GitHub successfully")
        } else {
          console.log("[v0] Failed to get GitHub")
        }
      } catch (error) {
        console.log("[v0] Failed to get GitHub")
      } finally {
        setLoading(false)
      }
    }
    fetchRepos()
  }, [])

  return (
    <section id="insights" className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary text-secondary-foreground">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 uppercase tracking-tight">Latest Insights & Code</h2>
          <p className="text-xl text-secondary-foreground/70 font-medium">
            Exploring engineering challenges through open source. Click on a project to read its documentation.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-8 flex items-center gap-3 uppercase tracking-wide">
            <Github className="h-8 w-8" />
            GitHub Repositories
          </h3>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl font-bold uppercase">Loading repositories...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
              {repositories.map((repo, idx) => (
                <div
                  key={idx}
                  className="bg-background text-foreground border-4 border-border p-6 shadow-brutal hover:shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  <div className="space-y-4">
                    <div>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-bold text-foreground hover:text-accent transition-colors uppercase tracking-wide inline-flex items-center gap-2"
                      >
                        {repo.name}
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                      {repo.description || "No description available."}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4">
                        {repo.language && (
                          <span className="text-xs px-3 py-1 bg-amber text-amber-foreground border-4 border-border font-bold uppercase">
                            {repo.language}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-sm font-bold">
                          <Star className="h-4 w-4 fill-current" />
                          {repo.stargazers_count}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline flex items-center gap-2 font-bold uppercase tracking-wide text-sm"
                      >
                        <BookOpen className="h-4 w-4" />
                        Read Article
                      </a>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline flex items-center gap-2 font-bold uppercase tracking-wide text-sm"
                      >
                        <Github className="h-4 w-4" />
                        Code
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
