import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock the internal books helpers so tests don't depend on path aliases resolving in the test runner
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

import BooksTable from '../BooksTable';

const sampleBook = (id: number, avg?: number) => ({
    id,
    title: `Book ${id}`,
    status: 'NOT_STARTED',
    createdAt: '',
    updatedAt: '',
    authors: [],
    averageRating: avg,
});

describe('BooksTable parity and optimistic overlay', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('reflects server updates when no optimistic changes', () => {
        const { rerender } = render(<BooksTable books={[sampleBook(1, 1.0)]} ratings={[]} />);
        // initial rating shows 1.0
        expect(screen.getByText('1.0')).toBeInTheDocument();

        // server updates average to 2.0 -> re-render with new props
        rerender(<BooksTable books={[sampleBook(1, 2.0)]} ratings={[]} />);
        expect(screen.getByText('2.0')).toBeInTheDocument();
    });

    it('retains optimistic update over subsequent server updates', async () => {
        // mock fetch to succeed and return updated book with avg 9.0
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, averageRating: 9.0 }) } as any));

        const { rerender } = render(<BooksTable books={[sampleBook(1, 1.0)]} ratings={[]} isAdmin={true} />);
        expect(screen.getByText('1.0')).toBeInTheDocument();

        // click the toggle button to trigger optimistic update
        const toggle = screen.getByRole('button', { name: /toggle status for book 1/i });
        fireEvent.click(toggle);

        // optimistic value should be applied (9.0)
        expect(await screen.findByText('9.0')).toBeInTheDocument();

        // server later reports a different average (2.0) — re-render with new prop
        rerender(<BooksTable books={[sampleBook(1, 2.0)]} ratings={[]} isAdmin={true} />);

        // optimistic overlay should still show 9.0
        expect(screen.getByText('9.0')).toBeInTheDocument();
    });
});