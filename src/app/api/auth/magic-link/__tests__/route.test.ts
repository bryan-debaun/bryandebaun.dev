import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import type { ProxyResult } from '@/lib/mcp-proxy';

vi.mock('@/lib/mcp-proxy', () => ({ proxyCall: vi.fn() }));

describe('POST /api/auth/magic-link', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        process.env.DEBUG_AUTH = '1';
    });

    it('proxies successful magic-link request and returns upstream body/status', async () => {
        const { proxyCall } = await import('@/lib/mcp-proxy');
        (proxyCall as any).mockResolvedValue({ status: 200, body: { status: 'accepted' } } satisfies ProxyResult);

        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: 'test@example.com' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(200);
        const json = await (res as Response).json();
        expect(json).toEqual({ status: 'accepted' });
    });

    it('forwards upstream non-2xx response and logs details when debug enabled', async () => {
        const { proxyCall } = await import('@/lib/mcp-proxy');
        (proxyCall as any).mockResolvedValue({ status: 400, body: { error: 'Failed to fetch from MCP' } } satisfies ProxyResult);

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: 'bad@example.com' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(400);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Failed to fetch from MCP' });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth.magic-link: non-2xx response'), expect.any(Object));
        spy.mockRestore();
    });

    it('sanitizes upstream error body in production (no DEBUG_AUTH)', async () => {
        const { proxyCall } = await import('@/lib/mcp-proxy');
        process.env.DEBUG_AUTH = '0';
        (proxyCall as any).mockResolvedValue({ status: 502, body: { error: 'Failed to fetch from MCP' } } satisfies ProxyResult);

        const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email: 'prod@example.com' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Failed to fetch from MCP' });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth.magic-link: non-2xx response (sanitized)'), expect.any(Object));
        spy.mockRestore();
    });

    it('returns 502 and logs when proxyCall throws', async () => {
        const { proxyCall } = await import('@/lib/mcp-proxy');
        (proxyCall as any).mockImplementation(() => { throw new Error('network'); });

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
