import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Mock the server-fetch helper used by the route
vi.mock('@/lib/server-fetch', () => ({ fetchWithFallback: vi.fn() }));

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        process.env.DEBUG_AUTH = '1';
    });

    it('proxies successful registration and returns upstream body/status', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'content-type': 'application/json' } }));

        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'pw' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(200);
        const json = await (res as Response).json();
        expect(json).toEqual({ success: true });
    });

    it('forwards upstream non-2xx response and logs details when debug enabled', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockResolvedValue(new Response('Supabase provisioning failed', { status: 502, headers: { 'content-type': 'text/plain' } }));

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'bad@example.com', password: 'x' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        expect(await (res as Response).text()).toBe('Supabase provisioning failed');
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth.register: upstream returned non-2xx'), expect.any(Object));
        spy.mockRestore();
    });

    it('sanitizes upstream error body in production (no DEBUG_AUTH)', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        process.env.DEBUG_AUTH = '0'; // simulate production (force debug off)
        (fetchWithFallback as any).mockResolvedValue(new Response('Supabase provisioning failed', { status: 502, headers: { 'content-type': 'text/plain' } }));

        const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'prod@example.com', password: 'x' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Registration failed' });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth.register: upstream returned non-2xx (sanitized response)'), expect.any(Object));
        spy.mockRestore();
    });

    it('returns 502 and logs when fetchWithFallback throws', async () => {
        const { fetchWithFallback } = await import('@/lib/server-fetch');
        (fetchWithFallback as any).mockImplementation(() => { throw new Error('network'); });

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'x@y.com', password: 'pw' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Failed to register' });
        expect(spy).toHaveBeenCalledWith('Auth register proxy failed', expect.anything());
        spy.mockRestore();
    });
});
