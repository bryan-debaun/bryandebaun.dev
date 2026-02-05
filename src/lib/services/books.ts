import type { BookWithAuthors } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';

export async function listBooks(): Promise<BookWithAuthors[]> {
    const res = await fetchWithFallback('/api/mcp/books');
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.books ?? [];
}

export async function getBookById(id: number): Promise<BookWithAuthors | null> {
    const res = await fetchWithFallback(`/api/mcp/books/${id}`);
    if (!res.ok) return null;
    const book = await res.json();
    return book ?? null;
}
