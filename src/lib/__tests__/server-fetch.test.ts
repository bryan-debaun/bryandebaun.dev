import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithFallback } from '../server-fetch';

describe('fetchWithFallback', () => {
    const realFetch = global.fetch;
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    afterEach(() => {
        global.fetch = realFetch;
        delete process.env.NEXT_PUBLIC_SITE_URL;
    });

    it('returns the response when fetch succeeds', async () => {
        const body = { ok: true };
        global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));
        const res = await fetchWithFallback('/test', undefined, 1000);
        expect(await res.json()).toEqual(body);
    });

    it('retries with origin when runtime rejects relative URLs', async () => {
        process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
        global.fetch = vi.fn()
            .mockImplementationOnce(() => Promise.reject(new Error('Failed to parse URL')))
            .mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify({ origin: true }), { status: 200 })));

        const res = await fetchWithFallback('/api/test', undefined, 1000);
        expect(await res.json()).toEqual({ origin: true });
        expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('returns a fallback response on timeout', async () => {
        vi.useFakeTimers();

        // Mock fetch that rejects when the AbortController signal is aborted
        global.fetch = vi.fn((_, init?: RequestInit) => {
            return new Promise((_, reject) => {
                const signal = (init as any)?.signal;
                if (signal) {
                    signal.addEventListener('abort', () => {
                        const e = new Error('The operation was aborted.')
                            ; (e as any).name = 'AbortError';
                        reject(e);
                    });
                }
            });
        });

        const p = fetchWithFallback('/api/slow', undefined, 10);
        // advance timers so the request is aborted
        await vi.advanceTimersByTimeAsync(20);
        const res = await p;
        expect(res.status).toBe(504);
        const body = await res.json();
        // Production behavior returns an empty fallback; in dev/debug we include an error key.
        expect(body).toHaveProperty('error', 'Failed to fetch');

        vi.useRealTimers();
    });
});
