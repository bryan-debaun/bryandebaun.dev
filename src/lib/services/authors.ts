import type { AuthorWithBooks } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';

export async function listAuthors(): Promise<AuthorWithBooks[]> {
    const res = await fetchWithFallback('/api/mcp/authors', { cache: 'no-store' });
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.authors ?? [];
}

export async function getAuthorById(id: number): Promise<AuthorWithBooks | null> {
    const res = await fetchWithFallback(`/api/mcp/authors/${id}`);
    if (!res.ok) return null;
    const author = await res.json();
    return author ?? null;
}
