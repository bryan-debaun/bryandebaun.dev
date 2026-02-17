import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/server-fetch', () => ({ fetchWithFallback: vi.fn() }));

describe('POST /api/auth/magic-link', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        process.env.DEBUG_AUTH = '1';
    });

    it('proxies successful magic-link request and returns upstream body/status', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockResolvedValue(new Response(JSON.stringify({ status: 'accepted' }), { status: 202, headers: { 'content-type': 'application/json' } }));

        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: 'test@example.com' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(202);
        const json = await (res as Response).json();
        expect(json).toEqual({ status: 'accepted' });
    });

    it('forwards upstream non-2xx response and logs details when debug enabled', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockResolvedValue(new Response('Bad request', { status: 400, headers: { 'content-type': 'text/plain' } }));

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: 'bad@example.com' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(400);
        expect(await (res as Response).text()).toBe('Bad request');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth.magic-link: upstream returned non-2xx'), expect.any(Object));
        spy.mockRestore();
    });

    it('sanitizes upstream error body in production (no DEBUG_AUTH)', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        process.env.DEBUG_AUTH = '0';
        (fetchWithFallback as any).mockResolvedValue(new Response('Internal failure', { status: 502, headers: { 'content-type': 'text/plain' } }));

        const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: 'prod@example.com' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Failed to send magic link' });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth.magic-link: upstream returned non-2xx (sanitized response)'), expect.any(Object));
        spy.mockRestore();
    });

    it('returns 502 and logs when fetchWithFallback throws', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockImplementation(() => { throw new Error('network'); });

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: 'x@y.com' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Failed to send magic link' });
        expect(spy).toHaveBeenCalledWith('Auth magic-link proxy failed', expect.anything());
        spy.mockRestore();
    });
});
