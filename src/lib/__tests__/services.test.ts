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

    it('listRatings returns ratings array', async () => {
        (fetchWithFallback as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(JSON.stringify({ ratings: [{ id: 1, rating: 5 }] }), { status: 200 }));
        const r = await ratingsSvc.listRatings();
        expect(r.length).toBe(1);
    });
});
