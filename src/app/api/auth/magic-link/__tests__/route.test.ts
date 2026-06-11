import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('POST /api/auth/magic-link', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        process.env.DEBUG_AUTH = '1';
        process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    });

    it('calls Supabase signInWithOtp and returns 202 on success', async () => {
        const { createClient } = await import('@/lib/supabase/server');
        const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });
        (createClient as any).mockResolvedValue({
            auth: { signInWithOtp: mockSignInWithOtp },
        });

        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com' }),
            headers: { 'content-type': 'application/json' },
        });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(202);
        const json = await (res as Response).json();
        expect(json).toEqual({ status: 'accepted' });
        expect(mockSignInWithOtp).toHaveBeenCalledWith({
            email: 'test@example.com',
            options: {
                emailRedirectTo: 'http://localhost:3000/auth/callback',
            },
        });
    });

    it('returns 400 when Supabase returns an error', async () => {
        const { createClient } = await import('@/lib/supabase/server');
        const mockSignInWithOtp = vi
            .fn()
            .mockResolvedValue({ error: { message: 'Invalid email' } });
        (createClient as any).mockResolvedValue({
            auth: { signInWithOtp: mockSignInWithOtp },
        });

        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', {
            method: 'POST',
            body: JSON.stringify({ email: 'bad@example.com' }),
            headers: { 'content-type': 'application/json' },
        });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(400);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Invalid email' });
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('auth.magic-link: failed'),
            expect.any(Object),
        );
        spy.mockRestore();
    });

    it('logs less detail in production (no DEBUG_AUTH)', async () => {
        const { createClient } = await import('@/lib/supabase/server');
        process.env.DEBUG_AUTH = '0';
        const mockSignInWithOtp = vi.fn().mockResolvedValue({
            error: { message: 'Service error' },
        });
        (createClient as any).mockResolvedValue({
            auth: { signInWithOtp: mockSignInWithOtp },
        });

        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', {
            method: 'POST',
            body: JSON.stringify({ email: 'prod@example.com' }),
            headers: { 'content-type': 'application/json' },
        });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(400);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Service error' });
        // In production mode, logs should be minimal (no DEBUG_AUTH)
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    it('returns 500 and logs when signInWithOtp throws', async () => {
        const { createClient } = await import('@/lib/supabase/server');
        (createClient as any).mockRejectedValue(new Error('network'));

        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const route = await import('../route');
        const req = new Request('http://localhost/api/auth/magic-link', {
            method: 'POST',
            body: JSON.stringify({ email: 'x@y.com' }),
            headers: { 'content-type': 'application/json' },
        });
        const res = await route.POST(req as unknown as NextRequest);

        expect(res.status).toBe(500);
        const json = await (res as Response).json();
        expect(json).toEqual({ error: 'Failed to send magic link' });
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('auth.magic-link: exception'),
            expect.any(Object),
        );
        spy.mockRestore();
    });
});
