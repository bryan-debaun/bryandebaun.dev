import { describe, it, expect, vi } from 'vitest';
import * as route from '../route';
import type { Api } from '@bryandebaun/mcp-client';

describe('GET /api/mcp/books/[id]', () => {
    it('returns a book from the generated Api client', async () => {
        const fakeApi = { api: { getBook: vi.fn().mockResolvedValue({ data: { id: 1, title: 'Test Book' } }) } } as any;
        const spy = vi.spyOn(route as { createApi: () => Api<unknown> }, 'createApi').mockImplementation(() => fakeApi);

        const res = (await route.GET(new Request('http://localhost/api/mcp/books/1'), { params: { id: '1' } as any })) as Response;
        const json = await res.json();
        expect(json.id).toBe(1);
        expect(json.title).toBe('Test Book');

        spy.mockRestore();
    });

    it('returns 502 when the generated client throws', async () => {
        const fakeApi = { api: { getBook: vi.fn().mockRejectedValue(new Error('boom')) } } as any;
        const spy = vi.spyOn(route as { createApi: () => Api<unknown> }, 'createApi').mockImplementation(() => fakeApi);

        const res = (await route.GET(new Request('http://localhost/api/mcp/books/1'), { params: { id: '1' } as any })) as Response;
        expect(res.status).toBe(502);

        spy.mockRestore();
    });
});
