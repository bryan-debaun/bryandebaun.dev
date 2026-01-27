import type { Repo } from "../../lib/github"
import { getShowcaseRepos } from "../../lib/github"

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
        <div className="prose prose-norwegian dark:prose-invert max-w-none px-4 md:px-6 lg:px-8 projects-list">
            <h2>Projects</h2>
            <div className="space-y-1">
                {repos.map((r) => (
                    <a key={r.name} href={r.html_url} target="_blank" rel="noopener noreferrer" aria-label={`${r.name} — ${r.description ?? 'Repository'}`} title={r.name} className="group flex items-center gap-3">
                        <div className="w-24 flex-shrink-0 md:w-32 lg:w-40">
                            <span className="block w-full rounded-lg px-3 py-2 no-underline btn btn--primary uppercase text-xs overflow-hidden whitespace-nowrap truncate text-center shadow-[0_6px_18px_rgba(64,215,208,0.08)] hover:shadow-[0_10px_28px_rgba(64,215,208,0.14)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.6)] dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.7)]" aria-hidden="true">
                                {r.name}
                            </span>
                        </div>
                        <div className="flex-1 flex items-center">
                            <span className="mr-3 inline-block w-[2px] h-6 rounded bg-gradient-to-b from-[var(--color-norwegian-400)] to-[var(--color-fjord-600)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none" aria-hidden="true" />
                            <p className="text-sm leading-relaxed text-[var(--color-norwegian-700)] opacity-90 transition duration-200 transform group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_18px_rgba(64,215,208,0.04)] group-hover:opacity-100 motion-reduce:transition-none cursor-pointer">{r.description ?? ''}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}
