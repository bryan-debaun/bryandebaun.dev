import { describe, it, expect, vi } from 'vitest';
import * as route from '../route';
import type { Api } from '@bryandebaun/mcp-client';

describe('GET /api/mcp/ratings', () => {
    it('returns ratings from the generated Api client', async () => {
        // Stub the createApi factory to return a fake Api instance
        const fakeApi = { api: { listRatings: vi.fn().mockResolvedValue({ data: { ratings: [{ id: 1, bookId: 1, userId: 1, rating: 5, createdAt: '', updatedAt: '', book: { id: 1, title: 'Test Book' }, user: { id: 1, email: 'u@example.com' } }], total: 1 } }) } } as any;

        const spy = vi.spyOn(route as { createApi: () => Api<unknown> }, 'createApi').mockImplementation(() => fakeApi);

        const res = (await route.GET(new Request('http://localhost/api/mcp/ratings'))) as Response;
        const json = await res.json();
        expect(json.total).toBe(1);
        expect(json.ratings[0].rating).toBe(5);

        spy.mockRestore();
    });

    it('forwards the bookId query param to the generated client', async () => {
        const listRatings = vi.fn().mockResolvedValue({ data: { ratings: [], total: 0 } });
        const fakeApi = { api: { listRatings } } as any;
        const spy = vi.spyOn(route as { createApi: () => Api<unknown> }, 'createApi').mockImplementation(() => fakeApi);

        await route.GET(new Request('http://localhost/api/mcp/ratings?bookId=2'));
        expect(listRatings).toHaveBeenCalledWith({ bookId: 2 });

        spy.mockRestore();
    });
});
