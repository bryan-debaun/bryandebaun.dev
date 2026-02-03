export interface Repo {
    name: string
    description: string | null
    html_url: string
    homepage?: string | null
    archived: boolean
    fork: boolean
    topics?: string[]
}

type GetUserReposOptions = {
    token?: string
    perPage?: number
    revalidateSeconds?: number
}

/**
 * Fetch all repositories for a given GitHub user (handles pagination).
 * Uses Next.js fetch cache `next.revalidate` when `revalidateSeconds` is provided.
 */
export async function getUserRepos(username: string, opts: GetUserReposOptions = {}): Promise<Repo[]> {
    const perPage = opts.perPage ?? 100;
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json'
    };

    // Prefer an explicit token, otherwise fall back to env var (server-only)
    const token = opts.token ?? process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `token ${token}`;

    let page = 1;
    const all: Repo[] = [];

    while (true) {
        const url = `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&type=owner&sort=updated`;
        const res = await fetch(url, {
            headers,
            // Use ISR-style revalidation when provided
            next: { revalidate: opts.revalidateSeconds ?? 86400 }
        });

        if (!res.ok) {
            // For common auth/rate-limit failures, include header info to make debugging easier
            const remaining = res.headers.get('x-ratelimit-remaining');
            const reset = res.headers.get('x-ratelimit-reset');
            const message = `GitHub API request failed: ${res.status} (remaining: ${remaining}, reset: ${reset})`;
            throw new Error(message);
        }

        const data = (await res.json()) as Array<Record<string, unknown>>;
        if (!Array.isArray(data) || data.length === 0) break;

        all.push(...data.map((r) => {
            const topics = Array.isArray(r.topics) ? r.topics.filter((t): t is string => typeof t === 'string').map(String) : [];
            return {
                name: String(r.name ?? ''),
                description: typeof r.description === 'string' ? r.description : null,
                html_url: String(r.html_url ?? ''),
                homepage: r.homepage && typeof r.homepage === 'string' ? r.homepage : null,
                archived: Boolean(r.archived),
                fork: Boolean(r.fork),
                topics,
            };
        }));

        if (data.length < perPage) break;
        page++;
    }

    return all;
}

export type ShowcaseOptions = {
    token?: string
    revalidateSeconds?: number
    includeForks?: boolean
    includeArchived?: boolean
    topic?: string | null
}

/**
 * Returns a curated list of repos suitable for a Projects listing.
 * By default excludes forks and archived repositories.
 */
export async function getShowcaseRepos(username: string, opts: ShowcaseOptions = {}) {
    const repos = await getUserRepos(username, { token: opts.token, revalidateSeconds: opts.revalidateSeconds });
    return repos.filter((r) => {
        if (!opts.includeForks && r.fork) return false;
        if (!opts.includeArchived && r.archived) return false;
        if (opts.topic && !(r.topics || []).includes(opts.topic)) return false;
        return true;
    });
}
