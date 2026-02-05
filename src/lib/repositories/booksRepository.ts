import type { BookWithAuthors } from '@bryandebaun/mcp-client';
import * as svc from '@/lib/services/books';

export async function listBooks(): Promise<BookWithAuthors[]> {
    return await svc.listBooks();
}

export async function getBookById(id: number): Promise<BookWithAuthors | null> {
    return await svc.getBookById(id);
}

export async function updateBookStatus(id: number, status: string): Promise<BookWithAuthors> {
    const res = await fetch(`/api/admin/books/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update book');
    return await res.json();
}
