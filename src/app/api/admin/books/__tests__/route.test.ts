import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Default: admin allowed. Individual tests can override with mockResolvedValueOnce.
vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

// Mock Supabase server client so routes that call getSession() don't need the
// Next.js request store (cookies) to be active during unit tests.
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'mock-jwt-token' } },
                error: null,
            }),
        },
    }),
}));

import { requireAdmin } from '@/lib/auth-guard';

vi.mock('@bryandebaun/mcp-client', async (importOriginal) => {
    const original = (await importOriginal()) as any;
    return {
        ...original,
        Api: class {
            setSecurityData = vi.fn();
            api = {
                updateBook: vi
                    .fn()
                    .mockResolvedValue({ data: { id: 1, title: 'Updated' } }),
                createBook: vi
                    .fn()
                    .mockResolvedValue({
                        data: {
                            id: 2,
                            title: 'New Book',
                            status: 'NOT_STARTED',
                        },
                    }),
                deleteBook: vi.fn().mockResolvedValue({}),
            };
        },
    } as any;
});

const unauthorizedResponse = new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 },
);
const forbiddenResponse = new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
});

describe('PATCH /api/admin/books/[id]', () => {
    beforeEach(() => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    });

    it('proxies updateBook to the generated client and returns updated book', async () => {
        const route = await import('../[id]/route');
        const req = new Request('http://localhost/api/admin/books/1', {
            method: 'PATCH',
            body: JSON.stringify({ title: 'Updated' }),
        });
        const res = await route.PATCH(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        const json = await (res as Response).json();
        expect(json.id).toBe(1);
        expect(json.title).toBe('Updated');
    });

    it('returns 401 when not authenticated', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            unauthorizedResponse,
        );
        const route = await import('../[id]/route');
        const req = new Request('http://localhost/api/admin/books/1', {
            method: 'PATCH',
            body: JSON.stringify({ title: 'x' }),
        });
        const res = await route.PATCH(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            forbiddenResponse,
        );
        const route = await import('../[id]/route');
        const req = new Request('http://localhost/api/admin/books/1', {
            method: 'PATCH',
            body: JSON.stringify({ title: 'x' }),
        });
        const res = await route.PATCH(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(403);
    });
});

describe('DELETE /api/admin/books/[id]', () => {
    beforeEach(() => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    });

    it('deletes a book and returns 204', async () => {
        const route = await import('../[id]/route');
        const req = new Request('http://localhost/api/admin/books/1', {
            method: 'DELETE',
        });
        const res = await route.DELETE(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(204);
    });

    it('returns 401 when not authenticated', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            unauthorizedResponse,
        );
        const route = await import('../[id]/route');
        const req = new Request('http://localhost/api/admin/books/1', {
            method: 'DELETE',
        });
        const res = await route.DELETE(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            forbiddenResponse,
        );
        const route = await import('../[id]/route');
        const req = new Request('http://localhost/api/admin/books/1', {
            method: 'DELETE',
        });
        const res = await route.DELETE(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(403);
    });
});

describe('POST /api/admin/books', () => {
    beforeEach(() => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    });

    it('creates a book and returns 201 with the new book', async () => {
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/books', {
            method: 'POST',
            body: JSON.stringify({ title: 'New Book' }),
        });
        const res = await route.POST(req as unknown as NextRequest);
        expect((res as Response).status).toBe(201);
        const json = await (res as Response).json();
        expect(json.id).toBe(2);
        expect(json.title).toBe('New Book');
    });

    it('returns 401 when not authenticated', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            unauthorizedResponse,
        );
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/books', {
            method: 'POST',
            body: JSON.stringify({ title: 'New Book' }),
        });
        const res = await route.POST(req as unknown as NextRequest);
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            forbiddenResponse,
        );
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/books', {
            method: 'POST',
            body: JSON.stringify({ title: 'New Book' }),
        });
        const res = await route.POST(req as unknown as NextRequest);
        expect((res as Response).status).toBe(403);
    });
});
