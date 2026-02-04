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
    render(<BooksTable books={[sampleBook]} ratings={[]} />);
    const link = screen.getByRole('link', { name: /test book/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/books/1');
});

test('renders author linking to author detail', () => {
    render(<BooksTable books={[sampleBook]} ratings={[]} />);
    const authorLink = screen.getByRole('link', { name: /alice author/i });
    expect(authorLink).toBeInTheDocument();
    expect(authorLink).toHaveAttribute('href', '/authors/2');
});
