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
        <div className="prose prose-norwegian dark:prose-invert max-w-none px-4 md:px-6 lg:px-8">
            <h2>Projects</h2>
            <div className="space-y-4">
                {repos.map((r) => (
                    <div key={r.name} className="flex items-center gap-4 group">
                        <div className="w-24 flex-shrink-0 md:w-32 lg:w-40">
                            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                            {/* @ts-ignore server component import is fine in this layout */}
                            <RepoCard repo={r} />
                        </div>
                        <div className="flex-1 flex items-center">
                            <p className="text-sm leading-relaxed text-[var(--color-norwegian-700)] opacity-90 transition-opacity transition-transform duration-200 ease-out group-hover:translate-x-2 group-hover:opacity-100 motion-reduce:transition-none">{r.description ?? ''}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
