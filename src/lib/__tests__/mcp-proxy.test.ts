import { describe, it, expect, vi } from 'vitest';
import { proxyCall } from '../mcp-proxy';

describe('proxyCall', () => {
    it('returns the payload when fn resolves', async () => {
        const fakeApi = { api: { listBooks: vi.fn().mockResolvedValue({ data: { books: [{ id: 1, title: 'A' }], total: 1 } }) } } as any;
        const res = await proxyCall((a) => a.api.listBooks(), fakeApi);
        expect(res.status).toBe(200);
        expect((res.body as any).books[0].title).toBe('A');
    });

    it('maps errors to a 502 status by default', async () => {
        const fakeApi = { api: { listBooks: vi.fn().mockRejectedValue(new Error('boom')) } } as any;
        const res = await proxyCall((a) => a.api.listBooks(), fakeApi);
        expect(res.status).toBe(502);
        expect((res.body as any).error).toBeDefined();
    });
});
