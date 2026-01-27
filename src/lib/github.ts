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
    const perPage = opts.perPage ?? 100
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json'
    }
    if (opts.token) headers.Authorization = `token ${opts.token}`

    let page = 1
    const all: Repo[] = []

    while (true) {
        const url = `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&type=owner&sort=updated`
        const res = await fetch(url, {
            headers,
            // Use ISR-style revalidation when provided
            next: { revalidate: opts.revalidateSeconds ?? 86400 }
        })

        if (!res.ok) {
            throw new Error(`GitHub API request failed: ${res.status}`)
        }

        const data = (await res.json()) as Array<Record<string, unknown>>
        if (!Array.isArray(data) || data.length === 0) break

        all.push(...data.map((r) => {
            const topics = Array.isArray(r.topics) ? (r.topics as unknown as string[]) : []
            return {
                name: String(r.name ?? ''),
                description: typeof r.description === 'string' ? r.description : null,
                html_url: String(r.html_url ?? ''),
                homepage: r.homepage && typeof r.homepage === 'string' ? r.homepage : null,
                archived: Boolean(r.archived),
                fork: Boolean(r.fork),
                topics,
            }
        }))

        if (data.length < perPage) break
        page++
    }

    return all
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
    const repos = await getUserRepos(username, { token: opts.token, revalidateSeconds: opts.revalidateSeconds })
    return repos.filter((r) => {
        if (!opts.includeForks && r.fork) return false
        if (!opts.includeArchived && r.archived) return false
        if (opts.topic && !(r.topics || []).includes(opts.topic)) return false
        return true
    })
}
