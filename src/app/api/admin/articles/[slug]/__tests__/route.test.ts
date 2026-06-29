import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

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

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
    revalidatePath: (path: string) => revalidatePath(path),
}));

import { requireAdmin } from '@/lib/auth-guard';

const updateArticle = vi.fn();
const deleteArticle = vi.fn();

vi.mock('@bryandebaun/mcp-client', async (importOriginal) => {
    const original = (await importOriginal()) as Record<string, unknown>;
    return {
        ...original,
        Api: class {
            setSecurityData = vi.fn();
            api = {
                updateArticle: (...args: unknown[]) => updateArticle(...args),
                deleteArticle: (...args: unknown[]) => deleteArticle(...args),
            };
        },
    };
});

const unauthorizedResponse = new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 },
);
const forbiddenResponse = new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
});

beforeEach(() => {
    vi.clearAllMocks();
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    updateArticle.mockResolvedValue({
        data: { id: 1, slug: 'cptsd', title: 'CPTSD', status: 'published' },
    });
    deleteArticle.mockResolvedValue({});
});

describe('PUT /api/admin/articles/[slug]', () => {
    it('updates (publish) and revalidates the public path', async () => {
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles/cptsd', {
            method: 'PUT',
            body: JSON.stringify({ status: 'published' }),
        });
        const res = await route.PUT(req as unknown as NextRequest, {
            params: { slug: 'cptsd' },
        });
        const json = await (res as Response).json();
        expect(json.status).toBe('published');
        expect(updateArticle).toHaveBeenCalledWith('cptsd', {
            status: 'published',
        });
        expect(revalidatePath).toHaveBeenCalledWith('/philosophy/cptsd');
    });

    it('revalidates both old and new slug on a rename', async () => {
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles/old', {
            method: 'PUT',
            body: JSON.stringify({ newSlug: 'new' }),
        });
        await route.PUT(req as unknown as NextRequest, {
            params: { slug: 'old' },
        });
        expect(revalidatePath).toHaveBeenCalledWith('/philosophy/new');
        expect(revalidatePath).toHaveBeenCalledWith('/philosophy/old');
    });

    it('surfaces a slug conflict as a 400 field error', async () => {
        updateArticle.mockRejectedValueOnce({ response: { status: 400 } });
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles/cptsd', {
            method: 'PUT',
            body: JSON.stringify({ newSlug: 'taken' }),
        });
        const res = await route.PUT(req as unknown as NextRequest, {
            params: { slug: 'cptsd' },
        });
        expect((res as Response).status).toBe(400);
        const json = await (res as Response).json();
        expect(json.fieldErrors.slug).toBeTruthy();
    });

    it('returns 401 when not authenticated', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            unauthorizedResponse,
        );
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles/x', {
            method: 'PUT',
            body: JSON.stringify({ title: 'x' }),
        });
        const res = await route.PUT(req as unknown as NextRequest, {
            params: { slug: 'x' },
        });
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            forbiddenResponse,
        );
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles/x', {
            method: 'PUT',
            body: JSON.stringify({ title: 'x' }),
        });
        const res = await route.PUT(req as unknown as NextRequest, {
            params: { slug: 'x' },
        });
        expect((res as Response).status).toBe(403);
    });
});

describe('DELETE /api/admin/articles/[slug]', () => {
    it('deletes and revalidates, returning 204', async () => {
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles/cptsd', {
            method: 'DELETE',
        });
        const res = await route.DELETE(req as unknown as NextRequest, {
            params: { slug: 'cptsd' },
        });
        expect((res as Response).status).toBe(204);
        expect(deleteArticle).toHaveBeenCalledWith('cptsd');
        expect(revalidatePath).toHaveBeenCalledWith('/philosophy');
        expect(revalidatePath).toHaveBeenCalledWith('/philosophy/cptsd');
    });

    it('returns 401 when not authenticated', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            unauthorizedResponse,
        );
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles/x', {
            method: 'DELETE',
        });
        const res = await route.DELETE(req as unknown as NextRequest, {
            params: { slug: 'x' },
        });
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            forbiddenResponse,
        );
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles/x', {
            method: 'DELETE',
        });
        const res = await route.DELETE(req as unknown as NextRequest, {
            params: { slug: 'x' },
        });
        expect((res as Response).status).toBe(403);
    });
});
