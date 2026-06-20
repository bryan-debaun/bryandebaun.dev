import { render, screen } from '@testing-library/react';
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

describe('BooksTable — display embedded personal rating', () => {
    it('shows embedded rating when provided', () => {
        render(
            <Providers>
                <BooksTable books={[sampleBook(1, 4.4)]} />
            </Providers>,
        );

        expect(screen.getByText('4.4')).toBeInTheDocument();
    });

    it('shows dash when rating is not provided', () => {
        render(
            <Providers>
                <BooksTable books={[sampleBook(1, undefined)]} />
            </Providers>,
        );

        // The dash character (—) should be present
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
