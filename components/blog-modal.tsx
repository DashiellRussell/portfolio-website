"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Github, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"
import { getRepoReadme } from "@/lib/github"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface BlogModalProps {
    isOpen: boolean
    onClose: () => void
    repo: {
        name: string
        description: string
        html_url: string
        owner: { login: string }
    } | null
}

export function BlogModal({ isOpen, onClose, repo }: BlogModalProps) {
    const [readme, setReadme] = useState<string>("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function fetchReadme() {
            if (repo) {
                setLoading(true)
                // Since this is a client component, we need to call an API route or use a server action.
                // For simplicity in this demo, we'll fetch directly from the public raw URL if possible,
                // but to avoid CORS, we should use the server utility via a server action or API route.
                // However, since we can't easily set up API routes in this environment without more files,
                // we'll try to fetch from the raw.githubusercontent.com URL which usually allows CORS,
                // OR we can just display the description and a link for now if CORS blocks it.

                // Actually, let's try to fetch via a client-side fetch to the raw URL.
                try {
                    const res = await fetch(`https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/main/README.md`)
                    if (res.ok) {
                        const text = await res.text()
                        setReadme(text)
                    } else {
                        // Try master branch
                        const resMaster = await fetch(`https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/master/README.md`)
                        if (resMaster.ok) {
                            const text = await resMaster.text()
                            setReadme(text)
                        } else {
                            setReadme("README not found or could not be loaded.")
                        }
                    }
                } catch (e) {
                    setReadme("Failed to load README.")
                }
                setLoading(false)
            }
        }

        if (isOpen && repo) {
            fetchReadme()
        }
    }, [isOpen, repo])

    if (!repo) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {repo.name}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                {repo.description}
                            </DialogDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                <Github className="mr-2 h-4 w-4" />
                                View on GitHub
                                <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {readme}
                            </ReactMarkdown>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
