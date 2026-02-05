import type { BookWithAuthors, ListBooksResponse } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';
import { createApi } from '@/lib/mcp';
import { unwrapApiResponse } from '@/lib/api-response';
import { looksLikeHtmlPayload } from '@/lib/mcp-proxy';

export async function listBooks(): Promise<BookWithAuthors[]> {
    // When running server-side, call the generated MCP client directly so we avoid
    // making an HTTP request to our own API route (which can fail in preview builds).
    if (typeof window === 'undefined') {
        try {
            const api = createApi();
            const res = await api.api.listBooks();
            const payload = unwrapApiResponse<ListBooksResponse>(res);

            if (await looksLikeHtmlPayload(payload)) {
                console.error('listBooks: detected HTML payload from MCP; falling back to proxy');
                throw new Error('Upstream returned HTML');
            }

            return payload?.books ?? [];
        } catch (e) {
            console.error('listBooks direct MCP call failed; falling back to proxy', e);
            // Fall back to calling our local proxy route which normalizes HTML responses
            const resProxy = await fetchWithFallback('/api/mcp/books');
            if (!resProxy.ok) return [];
            const payload = await resProxy.json();
            return payload?.books ?? [];
        }
    }

    const res = await fetchWithFallback('/api/mcp/books');
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.books ?? [];
}

export async function getBookById(id: number): Promise<BookWithAuthors | null> {
    if (typeof window === 'undefined') {
        try {
            const api = createApi();
            const res = await api.api.getBook(id);
            const payload = unwrapApiResponse<BookWithAuthors>(res);

            if (await looksLikeHtmlPayload(payload)) {
                console.error(`getBookById(${id}): detected HTML payload from MCP; falling back to proxy`);
                throw new Error('Upstream returned HTML');
            }

            return payload ?? null;
        } catch (e) {
            console.error('getBookById direct MCP call failed; falling back to proxy', e);
            const resProxy = await fetchWithFallback(`/api/mcp/books/${id}`);
            if (!resProxy || !resProxy.ok) return null;
            const book = await resProxy.json();
            return book ?? null;
        }
    }

    const res = await fetchWithFallback(`/api/mcp/books/${id}`);
    if (!res.ok) return null;
    const book = await res.json();
    return book ?? null;
}
