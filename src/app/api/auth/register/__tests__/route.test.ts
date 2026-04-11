import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import type { ProxyResult } from '@/lib/mcp-proxy';

// Mock the mcp-proxy module used by the route
vi.mock('@/lib/mcp-proxy', () => ({ proxyCall: vi.fn() }));

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        process.env.DEBUG_AUTH = '1';
    });

    it('proxies successful registration and returns upstream body/status', async () => {
        const { proxyCall } = await import('@/lib/mcp-proxy');
        (proxyCall as any).mockResolvedValue({ status: 200, body: { success: true } } satisfies ProxyResult);

        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'pw' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(200);
        const json = await (res as Response).json();
        expect(json).toEqual({ success: true });
    });

    it('forwards upstream non-2xx response and logs details when debug enabled', async () => {
        const { proxyCall } = await import('@/lib/mcp-proxy');
        (proxyCall as any).mockResolvedValue({ status: 502, body: { error: 'Failed to fetch from MCP' } } satisfies ProxyResult);

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'bad@example.com', password: 'x' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Failed to fetch from MCP' });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth.register: non-2xx response'), expect.any(Object));
        spy.mockRestore();
    });

    it('sanitizes upstream error body in production (no DEBUG_AUTH)', async () => {
        const { proxyCall } = await import('@/lib/mcp-proxy');
        process.env.DEBUG_AUTH = '0'; // simulate production (force debug off)
        (proxyCall as any).mockResolvedValue({ status: 502, body: { error: 'Failed to fetch from MCP' } } satisfies ProxyResult);

        const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify({ email: 'prod@example.com', password: 'x' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Failed to fetch from MCP' });
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('auth.register: non-2xx response (sanitized)'), expect.any(Object));
        spy.mockRestore();
    });

    it('returns 502 and logs when proxyCall throws', async () => {
        const { proxyCall } = await import('@/lib/mcp-proxy');
        (proxyCall as any).mockImplementation(() => { throw new Error('network'); });

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
