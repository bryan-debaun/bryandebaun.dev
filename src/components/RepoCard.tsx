import type { Repo } from '../lib/github';

/**
 * Format a raw GitHub repo name into a brand-safe, human-readable title.
 * Title-cases words, normalizes separators, and applies brand corrections
 * (DeBaun, MCP, BryanDeBaun.dev).
 */
export function formatRepoName(name: string): string {
    const lower = name.toLowerCase();
    // Special-case the website repo so the domain shows with brand capitalization
    if (lower === 'bryandebaun.dev') return 'BryanDeBaun.dev';

    let s = name
        .replace(/[-_.]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    // Brand corrections (case-insensitive)
    s = s.replace(/debaun/gi, 'DeBaun');
    // Uppercase MCP acronym
    s = s.replace(/\bmcp\b/gi, 'MCP');
    return s;
}

/**
 * A single project rendered as a responsive card. The whole card is the link
 * to the repository. Topic chips fall back to nothing when no topics/language
 * are available in the data shape.
 */
export default function RepoCard({ repo }: { repo: Repo }) {
    const chips = repo.topics ?? [];

    return (
        <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${repo.name} — ${repo.description ?? 'Repository'}`}
            className="group flex h-full min-w-0 flex-col gap-3 rounded-xl border border-[var(--color-norwegian-300)] bg-[var(--background)] p-5 no-underline shadow-sm transition-shadow transition-transform duration-150 ease-out transform-gpu hover:border-[var(--color-fjord-600)] hover:shadow-md motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-fjord-600)] dark:border-[var(--color-norwegian-300-dark)] dark:hover:border-[var(--color-fjord-neon)]"
        >
            <div className="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-5 w-5 flex-shrink-0 text-[var(--color-fjord-600)] dark:text-[var(--color-fjord-neon)]"
                    aria-hidden="true"
                >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.58.82-2.14-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.14 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <h3 className="m-0 min-w-0 break-words text-base font-semibold leading-snug text-[var(--color-norwegian-700)] dark:text-[var(--color-white)]">
                    {formatRepoName(repo.name)}
                </h3>
            </div>

            {repo.description ? (
                <p className="m-0 line-clamp-3 text-sm leading-relaxed text-[var(--color-norwegian-700)] opacity-90 dark:text-[var(--color-norwegian-200)]">
                    {repo.description}
                </p>
            ) : null}

            {chips.length > 0 ? (
                <ul className="mt-auto flex list-none flex-wrap gap-2 p-0">
                    {chips.slice(0, 5).map((chip) => (
                        <li
                            key={chip}
                            className="max-w-[10rem] truncate rounded-full border border-[var(--color-norwegian-300)] bg-[var(--color-norwegian-100)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-norwegian-700)] dark:border-[var(--color-norwegian-300-dark)] dark:bg-[color-mix(in_srgb,var(--color-fjord-600)_18%,transparent)] dark:text-[var(--color-norwegian-200)]"
                        >
                            {chip}
                        </li>
                    ))}
                </ul>
            ) : null}
        </a>
    );
}
