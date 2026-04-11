import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import type { AxiosResponse } from 'axios';

// Create mock methods that will be shared across all Api instances
const mockVerifyGet = vi.fn();
const mockVerifyPost = vi.fn();

vi.mock('@bryandebaun/mcp-client', () => ({
    Api: vi.fn(function (this: any) {
        this.api = {
            verifyGet: mockVerifyGet,
            verifyPost: mockVerifyPost
        };
        return this;
    })
}));

describe('GET /api/auth/magic-link/verify', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DEBUG_AUTH = '1';
    });

    it('proxies GET verify and mirrors redirect + Set-Cookie', async () => {
        mockVerifyGet.mockResolvedValue({
            data: '',
            status: 302,
            statusText: 'Found',
            headers: { location: '/', 'set-cookie': ['session=abc; HttpOnly'] },
            config: {} as any
        } as AxiosResponse);

        const route = await import('../verify/route');
        const req = new Request('http://localhost/api/auth/magic-link/verify?token=abc', { method: 'GET' });
        const res = await route.GET(req as unknown as NextRequest);

        expect(res.status).toBe(302);
        expect(res.headers.get('set-cookie')).toBe('session=abc; HttpOnly');
    });

    it('proxies POST verify and returns JSON body', async () => {
        mockVerifyPost.mockResolvedValue({
            data: { ok: true },
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            config: {} as any
        } as AxiosResponse);

        const route = await import('../verify/route');
        const req = new Request('http://localhost/api/auth/magic-link/verify', { method: 'POST', body: JSON.stringify({ token: 'abc' }), headers: { 'content-type': 'application/json' } });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(200);
        expect(await (res as Response).json()).toEqual({ ok: true });
    });

    it('forwards upstream non-2xx response and logs details when debug enabled', async () => {
        const axiosError: any = new Error('Request failed');
        axiosError.isAxiosError = true;
        axiosError.response = { status: 400, data: { error: 'invalid token' } };
        mockVerifyGet.mockRejectedValue(axiosError);

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../verify/route');
        const req = new Request('http://localhost/api/auth/magic-link/verify?token=bad', { method: 'GET' });
        const res = await route.GET(req as unknown as NextRequest);

        expect(res.status).toBe(400);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'invalid token' });
        spy.mockRestore();
    });

    it('returns 502 when API call throws', async () => {
        mockVerifyGet.mockRejectedValue(new Error('network'));

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const route = await import('../verify/route');
        const req = new Request('http://localhost/api/auth/magic-link/verify?token=any', { method: 'GET' });
        const res = await route.GET(req as unknown as NextRequest);

        expect(res.status).toBe(502);
        expect(await (res as Response).json()).toEqual({ error: 'Failed to verify' });
        spy.mockRestore();
    });
});
