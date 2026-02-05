import type { BookWithAuthors, ListBooksResponse } from '@bryandebaun/mcp-client';
import type { AxiosResponse } from 'axios';
import { fetchWithFallback } from '@/lib/server-fetch';
import { createApi } from '@/lib/mcp';

export async function listBooks(): Promise<BookWithAuthors[]> {
    // When running server-side, call the generated MCP client directly so we avoid
    // making an HTTP request to our own API route (which can fail in preview builds).
    if (typeof window === 'undefined') {
        try {
            const api = createApi();
            const res = await api.api.listBooks();
            if (res && typeof res === 'object' && 'data' in res) {
                return (res as AxiosResponse<ListBooksResponse>).data?.books ?? [];
            }
            return (res as ListBooksResponse).books ?? []; 
        } catch (e) {
            console.error('listBooks direct MCP call failed', e);
            return [];
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
            if (res && typeof res === 'object' && 'data' in res) {
                return (res as AxiosResponse<BookWithAuthors>).data ?? null;
            }
            return (res as BookWithAuthors) ?? null;
        } catch (e) {
            console.error('getBookById direct MCP call failed', e);
            return null;
        }
    }

    const res = await fetchWithFallback(`/api/mcp/books/${id}`);
    if (!res.ok) return null;
    const book = await res.json();
    return book ?? null;
}
