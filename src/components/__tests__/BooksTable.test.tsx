import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock the internal books helpers so tests don't depend on path aliases resolving in the test runner
vi.mock('@/lib/books', () => ({
    bookColumnDescriptors: [
        { accessor: 'title', header: 'Title' },
        { id: 'authors', header: 'Authors' },
        { type: 'rating', header: 'Rating' },
        { accessor: 'status', header: 'Status' },
    ],
    generateBookRows: (books: any[]) => books.map((b) => ({ id: b.id, title: b.title, authors: b.authors, averageRating: b.averageRating, status: b.status })),
}));

import BooksTable from '../BooksTable';
import Providers from '@/components/Providers';

const sampleBook: any = {
    id: 1,
    title: 'Test Book',
    description: 'A test book',
    isbn: '123',
    createdAt: '',
    updatedAt: '',
    authors: [{ author: { id: 2, name: 'Alice Author' } }],
};

test('renders title linking to book detail', () => {
    render(<Providers><BooksTable books={[sampleBook]} ratings={[]} /></Providers>);
    // There are two "link" role elements that may match (the row and the anchor). Find the anchor by href.
    const links = screen.getAllByRole('link', { name: /test book/i });
    const anchor = links.find((l) => l.tagName === 'A' && (l as HTMLAnchorElement).getAttribute('href') === '/books/1');
    expect(anchor).toBeDefined();
});

test('renders author linking to author detail', () => {
    render(<Providers><BooksTable books={[sampleBook]} ratings={[]} /></Providers>);
    const authorLink = screen.getByRole('link', { name: /alice author/i });
    expect(authorLink).toBeInTheDocument();
    expect(authorLink).toHaveAttribute('href', '/authors/2');
});
