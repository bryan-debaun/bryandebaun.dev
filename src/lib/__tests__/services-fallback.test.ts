import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Force server-side branch by removing window
const originalWindow = (global as any).window;

vi.mock('@/lib/mcp', () => {
    return {
        createApi: vi.fn(),
    };
});

vi.mock('@/lib/server-fetch', () => {
    return {
        fetchWithFallback: vi.fn(),
    };
});

import { fetchWithFallback } from '@/lib/server-fetch';

// ensure the mock implementation is set before each test
const proxyResponses = (url: string) => {
    if (url.startsWith('/api/mcp/books/')) {
        return new Response(JSON.stringify({ id: 1, title: 'proxied book' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    }

    if (url === '/api/mcp/books') {
        return new Response(JSON.stringify({ books: [{ id: 1, title: 'proxied list' }] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    }

    if (url.startsWith('/api/mcp/ratings')) {
        return new Response(JSON.stringify({ ratings: [{ id: 1, rating: 7 }] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    }

    return new Response('{}', { status: 404 });
};


import { createApi } from '@/lib/mcp';
import { listBooks, getBookById } from '@/lib/services/books';
import { listRatings } from '@/lib/services/ratings';

describe('services fallback behavior (server-side)', () => {
    beforeEach(() => {
        (global as any).window = undefined;
        // set the implementation for the proxy responses each test
        (fetchWithFallback as any).mockImplementation(async (url: string) => proxyResponses(url));
    });

    afterEach(() => {
        (global as any).window = originalWindow;
        (createApi as any).mockReset();
    });

    it('falls back to proxy when listBooks returns HTML-like payload', async () => {
        // Mock createApi to return an object whose api.listBooks resolves to an Axios-like object
        (createApi as any).mockImplementation(() => ({ api: { listBooks: async () => ({ data: '<!doctype html>challenge' }) } }));

        const books = await listBooks();
        expect(books).toEqual([{ id: 1, title: 'proxied list' }]);
    });

    it('falls back to proxy when getBookById returns HTML-like payload', async () => {
        (createApi as any).mockImplementation(() => ({ api: { getBook: async () => ({ data: '<html>not json</html>' }) } }));

        const book = await getBookById(1);
        expect(book).toEqual({ id: 1, title: 'proxied book' });
    });

    it('falls back to proxy when listRatings returns HTML-like payload', async () => {
        (createApi as any).mockImplementation(() => ({ api: { listRatings: async () => ({ data: '<html>bot</html>' }) } }));

        const ratings = await listRatings({ bookId: 1 });
        expect(ratings).toEqual([{ id: 1, rating: 7 }]);
    });
});
