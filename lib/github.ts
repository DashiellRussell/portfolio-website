export interface GithubRepo {
    id: number
    name: string
    description: string
    html_url: string
    stargazers_count: number
    language: string
    updated_at: string
}

export async function getGithubRepos(username: string): Promise<GithubRepo[]> {
    try {
        const response = await fetch(
            `https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=6`,
            { next: { revalidate: 3600 } }
        )

        if (!response.ok) {
            throw new Error("Failed to fetch repos")
        }

        return response.json()
    } catch (error) {
        console.error("Error fetching repos:", error)
        return []
    }
}

export async function getRepoReadme(username: string, repo: string): Promise<string> {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${username}/${repo}/readme`,
            {
                headers: {
                    Accept: "application/vnd.github.raw"
                },
                next: { revalidate: 3600 }
            }
        )

        if (!response.ok) {
            return "No README found."
        }

        return response.text()
    } catch (error) {
        console.error("Error fetching readme:", error)
        return "Error loading README."
    }
}
