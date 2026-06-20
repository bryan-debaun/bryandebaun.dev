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
    generateBookRows: (books: any[]) =>
        books.map((b) => ({
            id: b.id,
            title: b.title,
            authors: b.authors,
            rating: b.rating,
            status: b.status,
        })),
}));

import BooksTable from '../BooksTable';
import Providers from '@/components/Providers';
import { ItemStatus } from '@/lib/types';

const sampleBook = (id: number, rating?: number) => ({
    id,
    title: `Book ${id}`,
    status: ItemStatus.NOT_STARTED,
    createdAt: '',
    updatedAt: '',
    authors: [],
    rating,
});

describe('BooksTable parity and optimistic overlay', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('reflects server updates when no optimistic changes', () => {
        const { rerender } = render(
            <Providers>
                <BooksTable books={[sampleBook(1, 1.0)]} />
            </Providers>,
        );
        // initial rating shows 1
        expect(screen.getByText('1')).toBeInTheDocument();

        // server updates rating to 2 -> re-render with new props
        rerender(
            <Providers>
                <BooksTable books={[sampleBook(1, 2.0)]} />
            </Providers>,
        );
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows edit and delete buttons for admin', () => {
        render(
            <Providers>
                <BooksTable books={[sampleBook(1, 1.0)]} isAdmin={true} />
            </Providers>,
        );
        expect(
            screen.getByRole('button', { name: /edit book 1/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /delete book 1/i }),
        ).toBeInTheDocument();
    });

    it('hides edit and delete buttons for non-admin', () => {
        render(
            <Providers>
                <BooksTable books={[sampleBook(1, 1.0)]} />
            </Providers>,
        );
        expect(
            screen.queryByRole('button', { name: /edit book 1/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /delete book 1/i }),
        ).not.toBeInTheDocument();
    });

    it('opens edit dialog when edit button clicked', async () => {
        render(
            <Providers>
                <BooksTable books={[sampleBook(1, 1.0)]} isAdmin={true} />
            </Providers>,
        );
        fireEvent.click(screen.getByRole('button', { name: /edit book 1/i }));
        expect(
            await screen.findByRole('dialog', { name: /edit book/i }),
        ).toBeInTheDocument();
    });
});
