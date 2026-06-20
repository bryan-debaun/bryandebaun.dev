import type {
    AuthorWithBooks,
    CreateAuthorRequest,
} from '@bryandebaun/mcp-client';

/**
 * Repository layer for authors - uses API routes for client-side operations
 * For server-side operations, use the service layer directly instead
 */

export async function listAuthors(): Promise<AuthorWithBooks[]> {
    const res = await fetch('/api/mcp/authors');
    if (!res.ok) {
        throw new Error(`Failed to fetch authors: ${res.status}`);
    }
    const data = await res.json();
    return data?.authors ?? [];
}

export async function createAuthor(
    data: CreateAuthorRequest,
): Promise<AuthorWithBooks> {
    const res = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create author');
    return await res.json();
}
