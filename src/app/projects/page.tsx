import type { Repo } from "../../lib/github"
import { getShowcaseRepos } from "../../lib/github"
import RepoCard from "../../components/RepoCard"

const curatedFallback: Repo[] = [
    {
        name: 'mcp-server',
        description: 'Extensible MCP server for Copilot agents; GitHub Issues integration and tooling.',
        html_url: 'https://github.com/bryan-debaun/mcp-server',
        homepage: null,
        archived: false,
        fork: false,
        topics: [],
    },
    {
        name: 'copilot-agents',
        description: 'VS Code Copilot agent configurations and templates (repo templates and examples).',
        html_url: 'https://github.com/bryan-debaun/copilot-agents',
        homepage: null,
        archived: false,
        fork: false,
        topics: [],
    },
    {
        name: 'bryandebaun.dev',
        description: 'This website: Next.js + TypeScript + Tailwind + MDX (Contentlayer).',
        html_url: 'https://github.com/bryan-debaun/bryandebaun.dev',
        homepage: null,
        archived: false,
        fork: false,
        topics: [],
    },
]

export default async function Projects() {
    let repos = curatedFallback
    try {
        const fetched = await getShowcaseRepos('bryan-debaun', { revalidateSeconds: 86400 })
        if (fetched && fetched.length > 0) {
            repos = fetched
        }
    } catch (err) {
        // Swallow errors and keep the curated fallback
        console.warn('Failed to fetch GitHub repos for Projects page:', err)
    }

    return (
        <div className="prose prose-norwegian dark:prose-invert">
            <h2>Projects</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {repos.map((r) => (
                    <div key={r.name}>
                        {/* RepoCard shows repo name, description, and optional site */}
                        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                        {/* @ts-ignore server component import is fine in this layout */}
                        <RepoCard repo={r} />
                    </div>
                ))}
            </div>
        </div>
    )
}
