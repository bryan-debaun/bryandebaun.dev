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

    // Format repo names with brand-safe corrections
    function formatRepoName(name: string) {
        const lower = name.toLowerCase();
        // Special-case the website repo so the domain shows with brand capitalization
        if (lower === 'bryandebaun.dev') return 'BryanDeBaun.dev';

        // Title-case words and normalize separators
        let s = name.replace(/[-_.]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        // Brand corrections (case-insensitive)
        // Replace any instance of 'debaun' (e.g. user, org, or camel-cased variants) with the brand-correct form
        s = s.replace(/debaun/ig, 'DeBaun');
        // Make MCP uppercase where it appears as an acronym
        s = s.replace(/\bmcp\b/ig, 'MCP');
        return s;
    }

    return (
        <div className="prose prose-norwegian dark:prose-invert max-w-none px-4 md:px-6 lg:px-8 projects-list">
            <h2>Projects</h2>
            <div className="space-y-1">
                {repos.map((r) => (
                    <a key={r.name} href={r.html_url} target="_blank" rel="noopener noreferrer" aria-label={`${r.name} — ${r.description ?? 'Repository'}`} title={r.name} className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-fjord-600)]">
                        <div className="w-24 flex-shrink-0 min-w-0 md:w-32 lg:w-40">
                            <span className="block w-full rounded-lg px-3 py-2 no-underline btn btn--primary btn--glass normal-case text-sm font-medium tracking-normal overflow-hidden text-center shadow-sm hover:shadow-md transition-transform transition-shadow duration-150 ease-out transform-gpu motion-safe:hover:-translate-y-0.5 active:scale-95 active:translate-y-0 dark:shadow-[0_6px_18px_rgba(0,0,0,0.6)] dark:hover:shadow-[0_10px_28px_rgba(0,0,0,0.7)]" aria-hidden="true">
                                <span className="inline-flex items-center gap-2 justify-center min-w-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 flex-shrink-0 opacity-90" aria-hidden="true">
                                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.58.82-2.14-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.14 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z" />
                                    </svg>
                                    <span className="truncate">{formatRepoName(r.name)}</span>
                                </span>
                            </span>
                        </div>
                        <div className="flex-1 flex items-center min-w-0">
                            <span className="mr-3 inline-block w-[2px] h-6 rounded bg-gradient-to-b from-[var(--color-norwegian-400)] to-[var(--color-fjord-600)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none" aria-hidden="true" />
                            <p className="text-sm leading-relaxed text-[var(--color-norwegian-700)] opacity-90 transition duration-200 transform group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_18px_rgba(64,215,208,0.04)] group-hover:opacity-100 motion-reduce:transition-none cursor-pointer">{r.description ?? ''}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}
