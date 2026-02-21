import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/server-fetch', () => ({ fetchWithFallback: vi.fn() }));

describe('GET /api/auth/magic-link/verify', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        process.env.DEBUG_AUTH = '1';
    });

    it('proxies GET verify and mirrors redirect + Set-Cookie', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockResolvedValue(new Response('', { status: 302, headers: { location: '/', 'set-cookie': 'session=abc; HttpOnly' } }));

        const route = await import('../verify/route');
        const req = new Request('http://localhost/api/auth/magic-link/verify?token=abc', { method: 'GET' });
        const res = await route.GET(req as unknown as NextRequest);

        expect(res.status).toBe(302);
        expect(res.headers.get('set-cookie')).toBe('session=abc; HttpOnly');
    });

    it('proxies POST verify and returns JSON body', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));

        const route = await import('../verify/route');
        const req = new Request('http://localhost/api/auth/magic-link/verify', { method: 'POST', body: JSON.stringify({ token: 'abc' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(200);
        expect(await (res as Response).json()).toEqual({ ok: true });
    });

    it('forwards upstream non-2xx response and logs details when debug enabled', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockResolvedValue(new Response('Invalid token', { status: 400 }));

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../verify/route');
        const req = new Request('http://localhost/api/auth/magic-link/verify?token=bad', { method: 'GET' });
        const res = await route.GET(req as unknown as NextRequest);

        expect(res.status).toBe(400);
        expect(await (res as Response).text()).toBe('Invalid token');
        spy.mockRestore();
    });

    it('returns 502 when fetchWithFallback throws', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockImplementation(() => { throw new Error('network'); });

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../verify/route');
        const req = new Request('http://localhost/api/auth/magic-link/verify?token=any', { method: 'GET' });
        const res = await route.GET(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        expect(await (res as Response).json()).toEqual({ error: 'Failed to verify' });
        spy.mockRestore();
    });
});
