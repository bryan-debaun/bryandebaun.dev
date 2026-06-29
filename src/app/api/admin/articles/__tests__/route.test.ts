import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Default: admin allowed. Individual tests can override with mockResolvedValueOnce.
vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

// Mock Supabase server client so routes that call getSession() don't need the
// Next.js request store (cookies) active during unit tests.
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

// Capture revalidatePath calls so we can assert the public paths are busted.
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
    revalidatePath: (path: string) => revalidatePath(path),
}));

import { requireAdmin } from '@/lib/auth-guard';

// Mutable handles so individual tests can change client behaviour (e.g. reject).
const listArticles = vi.fn();
const createArticle = vi.fn();

vi.mock('@bryandebaun/mcp-client', async (importOriginal) => {
    const original = (await importOriginal()) as Record<string, unknown>;
    return {
        ...original,
        Api: class {
            setSecurityData = vi.fn();
            api = {
                listArticles: (...args: unknown[]) => listArticles(...args),
                createArticle: (...args: unknown[]) => createArticle(...args),
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
    listArticles.mockResolvedValue({
        data: {
            articles: [
                { slug: 'a', title: 'A', status: 'published' },
                { slug: 'b', title: 'B', status: 'draft' },
            ],
            total: 2,
        },
    });
    createArticle.mockResolvedValue({
        data: { id: 9, slug: 'new-one', title: 'New', status: 'draft' },
    });
});

describe('GET /api/admin/articles', () => {
    it('lists all articles including drafts (status=all)', async () => {
        const route = await import('../route');
        const res = await route.GET();
        const json = await (res as Response).json();
        expect(json.articles).toHaveLength(2);
        expect(listArticles).toHaveBeenCalledWith({ status: 'all' });
    });

    it('returns 401 when not authenticated', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            unauthorizedResponse,
        );
        const route = await import('../route');
        const res = await route.GET();
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            forbiddenResponse,
        );
        const route = await import('../route');
        const res = await route.GET();
        expect((res as Response).status).toBe(403);
    });
});

describe('POST /api/admin/articles', () => {
    it('creates an article, returns 201, and revalidates public paths', async () => {
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles', {
            method: 'POST',
            body: JSON.stringify({
                slug: 'new-one',
                title: 'New',
                body: 'Hi',
            }),
        });
        const res = await route.POST(req as unknown as NextRequest);
        expect((res as Response).status).toBe(201);
        const json = await (res as Response).json();
        expect(json.slug).toBe('new-one');
        expect(revalidatePath).toHaveBeenCalledWith('/writing');
        expect(revalidatePath).toHaveBeenCalledWith('/writing/new-one');
    });

    it('surfaces a slug conflict as a 400 field error', async () => {
        createArticle.mockRejectedValueOnce({ response: { status: 400 } });
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles', {
            method: 'POST',
            body: JSON.stringify({
                slug: 'taken',
                title: 'Dup',
                body: 'x',
            }),
        });
        const res = await route.POST(req as unknown as NextRequest);
        expect((res as Response).status).toBe(400);
        const json = await (res as Response).json();
        expect(json.fieldErrors.slug).toBeTruthy();
        // No public revalidation when the create failed.
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('returns 401 when not authenticated', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            unauthorizedResponse,
        );
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles', {
            method: 'POST',
            body: JSON.stringify({ slug: 's', title: 't', body: 'b' }),
        });
        const res = await route.POST(req as unknown as NextRequest);
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            forbiddenResponse,
        );
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/articles', {
            method: 'POST',
            body: JSON.stringify({ slug: 's', title: 't', body: 'b' }),
        });
        const res = await route.POST(req as unknown as NextRequest);
        expect((res as Response).status).toBe(403);
    });
});
