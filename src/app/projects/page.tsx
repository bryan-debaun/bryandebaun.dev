import type { Metadata } from 'next';
import RepoCard from '@/components/RepoCard';
import type { Repo } from '../../lib/github';
import { getShowcaseRepos } from '../../lib/github';

export const metadata: Metadata = {
    title: 'Projects — Bryan DeBaun',
    description:
        'Open-source projects and technical demos by Bryan DeBaun, including the MCP server, Copilot agent tooling, and this site.',
};

const curatedFallback: Repo[] = [
    {
        name: 'mcp-server',
        description:
            'Extensible MCP server for Copilot agents; GitHub Issues integration and tooling.',
        html_url: 'https://github.com/bryan-debaun/mcp-server',
        homepage: null,
        archived: false,
        fork: false,
        topics: [],
    },
    {
        name: 'copilot-agents',
        description:
            'VS Code Copilot agent configurations and templates (repo templates and examples).',
        html_url: 'https://github.com/bryan-debaun/copilot-agents',
        homepage: null,
        archived: false,
        fork: false,
        topics: [],
    },
    {
        name: 'bryandebaun.dev',
        description:
            'This website: Next.js + TypeScript + Tailwind + MDX (contentlayer2).',
        html_url: 'https://github.com/bryan-debaun/bryandebaun.dev',
        homepage: null,
        archived: false,
        fork: false,
        topics: [],
    },
];

export default async function Projects() {
    let repos = curatedFallback;
    try {
        const fetched = await getShowcaseRepos('bryan-debaun', {
            revalidateSeconds: 86400,
        });
        if (fetched && fetched.length > 0) {
            repos = fetched;
        }
    } catch (err) {
        // Swallow errors and keep the curated fallback
        console.warn('Failed to fetch GitHub repos for Projects page:', err);
    }

    return (
        <div className="prose prose-norwegian dark:prose-invert max-w-none px-4 md:px-6 lg:px-8">
            <h2>Projects</h2>
            <ul className="not-prose grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
                {repos.map((r) => (
                    <li key={r.name} className="min-w-0">
                        <RepoCard repo={r} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
