import type { AuthorWithBooks, ListAuthorsResponse } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';
import { createApi } from '@/lib/mcp';
import { unwrapApiResponse } from '@/lib/api-response';
import { looksLikeHtmlPayload } from '@/lib/mcp-proxy';

export async function listAuthors(): Promise<AuthorWithBooks[]> {
    // Prefer direct MCP client call when MCP_BASE_URL is configured
    if (typeof window === 'undefined' && process.env.MCP_BASE_URL) {
        try {
            const api = createApi();
            const res = await api.api.listAuthors();
            const payload = unwrapApiResponse<ListAuthorsResponse>(res);

            if (await looksLikeHtmlPayload(payload)) {
                console.error('listAuthors: detected HTML payload from MCP; falling back to proxy');
                throw new Error('Upstream returned HTML');
            }

            return payload?.authors ?? [];
        } catch (e) {
            console.error('listAuthors direct MCP call failed; falling back to proxy', e);
            // Fall back to calling our local proxy route
            const resProxy = await fetchWithFallback('/api/mcp/authors', { cache: 'no-store' });
            if (!resProxy.ok) return [];
            const payload = await resProxy.json();
            return payload?.authors ?? [];
        }
    }

    // Default: call proxy route for same-origin requests
    const res = await fetchWithFallback('/api/mcp/authors', { cache: 'no-store' });
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.authors ?? [];
}

export async function getAuthorById(id: number): Promise<AuthorWithBooks | null> {
    // Prefer direct MCP client call when MCP_BASE_URL is configured
    if (typeof window === 'undefined' && process.env.MCP_BASE_URL) {
        try {
            const api = createApi();
            const res = await api.api.getAuthor(id);
            const payload = unwrapApiResponse<AuthorWithBooks>(res);

            if (await looksLikeHtmlPayload(payload)) {
                console.error(`getAuthorById(${id}): detected HTML payload from MCP; falling back to proxy`);
                throw new Error('Upstream returned HTML');
            }

            return payload ?? null;
        } catch (e) {
            console.error('getAuthorById direct MCP call failed; falling back to proxy', e);
            const resProxy = await fetchWithFallback(`/api/mcp/authors/${id}`);
            if (!resProxy || !resProxy.ok) {
                const txt = await resProxy.text().catch(() => '');
                throw new Error(`Failed to fetch author ${id}: ${resProxy.status}${txt ? ` - ${txt}` : ''}`);
            }
            const author = await resProxy.json();
            return author ?? null;
        }
    }

    // Default: call proxy route
    const res = await fetchWithFallback(`/api/mcp/authors/${id}`);
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Failed to fetch author ${id}: ${res.status}${txt ? ` - ${txt}` : ''}`);
    }
    const author = await res.json();
    return author ?? null;
}
