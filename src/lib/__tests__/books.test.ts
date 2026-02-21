import { generateBookRows } from '../books';

describe('generateBookRows', () => {
    it('returns books with embedded rating field', () => {
        const books = [{ id: 1, title: 'A', rating: 4.5, status: 'available', createdAt: '', updatedAt: '' }];

        const rows = generateBookRows(books as any);
        expect(rows[0].rating).toBe(4.5);
    });

    it('handles books without rating', () => {
        const books = [{ id: 1, title: 'A', status: 'available', createdAt: '', updatedAt: '' }];

        const rows = generateBookRows(books as any);
        expect(rows[0].rating).toBeUndefined();
    });
});