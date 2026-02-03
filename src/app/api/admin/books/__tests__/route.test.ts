import { describe, it, expect, vi } from 'vitest';

// Mock the generated Api class so creating a new Api() in the route returns a fake instance
import type { NextRequest } from 'next/server';

vi.mock('@bryandebaun/mcp-client', async (importOriginal) => {
    const original = (await importOriginal()) as any;
    return {
        ...original,
        Api: class {
            api = { updateBook: vi.fn().mockResolvedValue({ data: { id: 1, title: 'Updated' } }) };
        }
    } as any;
});

describe('PATCH /api/admin/books/[id]', () => {
    it('proxies updateBook to the generated client and returns updated book', async () => {
        const route = await import('../[id]/route');

        const req = new Request('http://localhost/api/admin/books/1', { method: 'PATCH', body: JSON.stringify({ title: 'Updated' }) });
        const res = await route.PATCH(req as unknown as NextRequest, { params: { id: '1' } });
        const json = await (res as Response).json();
        expect(json.id).toBe(1);
        expect(json.title).toBe('Updated');
    });
});
