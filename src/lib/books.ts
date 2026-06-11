import type { BookWithAuthors } from '@bryandebaun/mcp-client';
import type { ItemStatus } from '@/lib/types';

export type BookRow = BookWithAuthors & { status?: ItemStatus | string };
type ColumnDescriptor = {
    accessor?: keyof BookRow | string;
    header: string;
    id?: string;
    type?: 'text' | 'rating' | 'actions';
};

export const bookColumnDescriptors: ColumnDescriptor[] = [
    { accessor: 'title', header: 'Title', type: 'text' },
    { id: 'authors', header: 'Author(s)', type: 'text' },
    { id: 'rating', header: 'Rating', type: 'rating' },
    { accessor: 'status', header: 'Status', type: 'text' },
    { id: 'actions', header: '', type: 'actions' },
];

export function generateBookRows(books: BookWithAuthors[]): BookRow[] {
    // Books now have embedded personal rating field - no aggregation needed
    return books.map((b) => ({ ...b }));
}
