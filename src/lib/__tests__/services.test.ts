import { describe, it, expect, vi } from 'vitest';
import * as booksSvc from '../services/books';
import * as ratingsSvc from '../services/ratings';
import { fetchWithFallback } from '../server-fetch';

vi.mock('../server-fetch', () => ({
    fetchWithFallback: vi.fn(),
}));

describe('services', () => {
    it('listBooks returns empty array on non-ok', async () => {
        (fetchWithFallback as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(new Response('{}', { status: 504 }));
        const books = await booksSvc.listBooks();
        expect(books).toEqual([]);
    });

    it('listRatings returns empty array (deprecated)', async () => {
        // Ratings service is deprecated and returns empty arrays
        const r = await ratingsSvc.listRatings();
        expect(r).toEqual([]);
    });
});
