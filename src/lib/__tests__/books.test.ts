import { generateBookRows } from '../books';

describe('generateBookRows', () => {
    it('computes averages using the shared average implementation (rounded to 0.1)', () => {
        const books = [{ id: 1, title: 'A', status: 'available', createdAt: '', updatedAt: '' }];
        const ratings = [
            { id: 1, bookId: 1, rating: 1, createdAt: '', updatedAt: '' },
            { id: 2, bookId: 1, rating: 2, createdAt: '', updatedAt: '' },
            { id: 3, bookId: 1, rating: 2, createdAt: '', updatedAt: '' },
        ];

        const rows = generateBookRows(books as any, ratings as any);
        expect(rows[0].averageRating).toBe(1.7);
    });

    it('preserves precomputed averageRating on the book when present', () => {
        const books = [{ id: 1, title: 'A', averageRating: 4.4, status: 'available', createdAt: '', updatedAt: '' }];
        const ratings = [
            { id: 1, bookId: 1, rating: 1, createdAt: '', updatedAt: '' },
            { id: 2, bookId: 1, rating: 2, createdAt: '', updatedAt: '' },
        ];

        const rows = generateBookRows(books as any, ratings as any);
        expect(rows[0].averageRating).toBe(4.4);
    });
});