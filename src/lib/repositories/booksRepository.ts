import type {
    BookWithAuthors,
    CreateBookRequest,
    UpdateBookRequest,
} from '@bryandebaun/mcp-client';

/**
 * Repository layer for books - uses API routes for client-side operations
 * For server-side operations, use the service layer directly instead
 */

export async function listBooks(): Promise<BookWithAuthors[]> {
    // Client-side: use the MCP proxy API route
    const res = await fetch('/api/mcp/books');
    if (!res.ok) {
        throw new Error(`Failed to fetch books: ${res.status}`);
    }
    const data = await res.json();
    return data?.books ?? [];
}

export async function getBookById(id: number): Promise<BookWithAuthors | null> {
    // Client-side: use the MCP proxy API route
    const res = await fetch(`/api/mcp/books/${id}`);
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch book ${id}: ${res.status}`);
    }
    return await res.json();
}

export async function updateBookStatus(
    id: number,
    status: string,
): Promise<BookWithAuthors> {
    const res = await fetch(`/api/admin/books/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update book');
    return await res.json();
}

export async function createBook(
    data: CreateBookRequest,
): Promise<BookWithAuthors> {
    const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create book');
    return await res.json();
}

export async function updateBook(
    id: number,
    data: UpdateBookRequest & { rating?: number | null },
): Promise<BookWithAuthors> {
    const res = await fetch(`/api/admin/books/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update book');
    return await res.json();
}

export async function deleteBook(id: number): Promise<void> {
    const res = await fetch(`/api/admin/books/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) throw new Error('Failed to delete book');
}
