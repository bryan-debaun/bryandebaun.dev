import { render, screen } from '@testing-library/react';
import BooksTable from '../BooksTable';
import Providers from '@/components/Providers';
import { ItemStatus } from '@/lib/types';

const sampleBook = (id: number, avg?: number) => ({
    id,
    title: `Book ${id}`,
    status: ItemStatus.NOT_STARTED,
    createdAt: '',
    updatedAt: '',
    authors: [],
    averageRating: avg,
});

const ratingsFor = (bookId: number) => [
    { id: 1, bookId, rating: 1, createdAt: '', updatedAt: '' },
    { id: 2, bookId, rating: 2, createdAt: '', updatedAt: '' },
    { id: 3, bookId, rating: 2, createdAt: '', updatedAt: '' },
];

describe('BooksTable — prefer server averageRating when present', () => {
    it('shows server-provided averageRating when both book.averageRating and ratings are provided (fall back otherwise)', () => {
        // server provides 4.4 but ratings would compute to 1.7
        render(
            <Providers>
                <BooksTable books={[sampleBook(1, 4.4)]} ratings={ratingsFor(1)} />
            </Providers>,
        );

        expect(screen.getByText('4.4')).toBeInTheDocument();
    });

    it('falls back to computed rating when server averageRating is absent', () => {
        // no server avg; ratings compute to 1.7
        render(
            <Providers>
                <BooksTable books={[sampleBook(1, undefined)]} ratings={ratingsFor(1)} />
            </Providers>,
        );

        expect(screen.getByText('1.7')).toBeInTheDocument();
    });
});