import type { AuthorWithBooks, ListAuthorsResponse } from '@bryandebaun/mcp-client'
import { fetchWithFallback } from '@/lib/server-fetch'
import { createApi } from '@/lib/mcp'
import { unwrapApiResponse } from '@/lib/api-response'
import { looksLikeHtmlPayload } from '@/lib/mcp-proxy'

/**
 * Get Supabase access token for authenticated requests
 * Only call this from server-side code
 */
async function getSupabaseToken(): Promise<string | undefined> {
    try {
        // Dynamic import to avoid bundling server-only code in client
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const {
            data: { session },
        } = await supabase.auth.getSession()
        return session?.access_token
    } catch (error) {
        console.error('Failed to get Supabase session:', error)
        return undefined
    }
}

export async function listAuthors(): Promise<AuthorWithBooks[]> {
    // Prefer direct MCP client call when MCP_BASE_URL is configured
    if (typeof window === 'undefined' && process.env.MCP_BASE_URL) {
        try {
            const token = await getSupabaseToken()
            const api = createApi(token)
            const res = await api.api.listAuthors()
            const payload = unwrapApiResponse<ListAuthorsResponse>(res)

            if (await looksLikeHtmlPayload(payload)) {
                console.error('listAuthors: detected HTML payload from MCP; falling back to proxy')
                throw new Error('Upstream returned HTML')
            }

            return payload?.authors ?? []
        } catch (e) {
            console.error('listAuthors direct MCP call failed; falling back to proxy', e)
            // Fall back to calling our local proxy route
            const resProxy = await fetchWithFallback('/api/mcp/authors', { cache: 'no-store' })
            if (!resProxy.ok) return []
            const payload = await resProxy.json()
            return payload?.authors ?? []
        }
    }

    // Default: call proxy route for same-origin requests
    const res = await fetchWithFallback('/api/mcp/authors', { cache: 'no-store' })
    if (!res.ok) return []
    const payload = await res.json()
    return payload?.authors ?? []
}

export async function getAuthorById(id: number): Promise<AuthorWithBooks | null> {
    // Prefer direct MCP client call when MCP_BASE_URL is configured
    if (typeof window === 'undefined' && process.env.MCP_BASE_URL) {
        try {
            const token = await getSupabaseToken()
            const api = createApi(token)
            const res = await api.api.getAuthor(id)
            const payload = unwrapApiResponse<AuthorWithBooks>(res)

            if (await looksLikeHtmlPayload(payload)) {
                console.error(`getAuthorById(${id}): detected HTML payload from MCP; falling back to proxy`)
                throw new Error('Upstream returned HTML')
            }

            return payload ?? null
        } catch (e) {
            console.error('getAuthorById direct MCP call failed; falling back to proxy', e)
            const resProxy = await fetchWithFallback(`/api/mcp/authors/${id}`)
            if (!resProxy || !resProxy.ok) {
                const txt = await resProxy.text().catch(() => '')
                throw new Error(
                    `Failed to fetch author ${id}: ${resProxy.status}${txt ? ` - ${txt}` : ''}`
                )
            }
            const author = await resProxy.json()
            return author ?? null
        }
    }

    // Default: call proxy route
    const res = await fetchWithFallback(`/api/mcp/authors/${id}`)
    if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Failed to fetch author ${id}: ${res.status}${txt ? ` - ${txt}` : ''}`)
    }
    const author = await res.json()
    return author ?? null
}
