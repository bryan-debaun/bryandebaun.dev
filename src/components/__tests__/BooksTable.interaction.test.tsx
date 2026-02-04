import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Reuse the same mock descriptor used in parity tests
vi.mock('@/lib/books', () => ({
    bookColumnDescriptors: [
        { accessor: 'title', header: 'Title' },
        { id: 'authors', header: 'Authors' },
        { type: 'rating', header: 'Rating' },
        { accessor: 'status', header: 'Status' },
        { id: 'actions', type: 'actions', header: '' },
    ],
    generateBookRows: (books: any[]) => books.map((b) => ({ id: b.id, title: b.title, authors: b.authors, averageRating: b.averageRating, status: b.status })),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import BooksTable from '../BooksTable';
import Providers from '@/components/Providers';
import { ItemStatus } from '@bryandebaun/mcp-client';

const sampleBook = (id: number, avg?: number) => ({
    id,
    title: `Book ${id}`,
    status: ItemStatus.NOT_STARTED,
    createdAt: '',
    updatedAt: '',
    authors: [],
    averageRating: avg,
});

describe('BooksTable interactions', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        // Prevent jsdom navigation side-effects
        delete (window as any).location;
        (window as any).location = { href: '', assign: vi.fn(), replace: vi.fn() } as any;
    });

    afterEach(() => {
        vi.clearAllMocks();
        (window as any).location = originalLocation;
    });

    it('navigates when row clicked', () => {
        render(
            <Providers>
                <BooksTable books={[sampleBook(1, 1.0)]} ratings={[]} />
            </Providers>
        );

        // tr has role=link with accessible aria-label we supplied
        const row = screen.getByRole('link', { name: /open details for book 1/i });
        fireEvent.click(row);
        // our implementation assigns window.location.href
        expect((window as any).location.href).toBe('/books/1');
    });

    it('clicking author link does not trigger row navigation', () => {
        const bookWithAuthor = {
            id: 2,
            title: 'Book 2',
            status: ItemStatus.NOT_STARTED,
            createdAt: '',
            updatedAt: '',
            authors: [{ id: 42, name: 'AuthOne' }],
            averageRating: 4.0,
        } as any;

        render(
            <Providers>
                <BooksTable books={[bookWithAuthor]} ratings={[]} />
            </Providers>
        );

        const authorLink = screen.getByText('AuthOne');
        fireEvent.click(authorLink);
        expect((window as any).location.href).toBe('');
    });
});
