import { describe, it, expect, vi, afterEach } from 'vitest';

// Keep mocks local to these tests
afterEach(() => {
    vi.restoreAllMocks();
});

describe('Books page — prefer server averageRating and avoid extra ratings fetch', () => {
    it('does not call listRatings when every book already includes averageRating', async () => {
        const fakeBooks = [{ id: 1, title: 'A', averageRating: 4.4, createdAt: '', updatedAt: '', authors: [] }];

        await vi.doMock('@/lib/services/books', () => ({ listBooks: async () => fakeBooks }));

        const ratingsSpy = vi.fn(async () => { throw new Error('listRatings should not be called'); });
        await vi.doMock('@/lib/services/ratings', () => ({ listRatings: ratingsSpy }));

        // Import the page module and execute the server component function
        const page = (await import('@/app/books/page')).default as () => Promise<unknown>;
        await page(); // should not throw

        expect(ratingsSpy).not.toHaveBeenCalled();
    });

    it('falls back to fetching ratings when books lack averageRating', async () => {
        const fakeBooks = [{ id: 1, title: 'A', createdAt: '', updatedAt: '', authors: [] }];
        const fakeRatings = [{ id: 1, bookId: 1, rating: 5, createdAt: '', updatedAt: '' }];

        await vi.doMock('@/lib/services/books', () => ({ listBooks: async () => fakeBooks }));
        const ratingsSpy = vi.fn(async () => fakeRatings);
        await vi.doMock('@/lib/services/ratings', () => ({ listRatings: ratingsSpy }));

        const page = (await import('@/app/books/page')).default as () => Promise<unknown>;
        await page();

        expect(ratingsSpy).toHaveBeenCalled();
    });
});