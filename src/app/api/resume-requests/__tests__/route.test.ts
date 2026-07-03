import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

// Mutable handles so tests can steer auth + the MCP-backed service.
const getUser = vi.fn();
const getSession = vi.fn();
const createResumeRequest = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: (...args: unknown[]) => getUser(...args),
            getSession: (...args: unknown[]) => getSession(...args),
        },
    }),
}));

vi.mock('@/lib/services/resume-requests', () => ({
    createResumeRequest: (...args: unknown[]) => createResumeRequest(...args),
}));

function makeReq(body: unknown) {
    return new Request('http://localhost/api/resume-requests', {
        method: 'POST',
        body:
            body === undefined
                ? undefined
                : typeof body === 'string'
                  ? body
                  : JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    }) as unknown as NextRequest;
}

const verifiedUser = {
    id: 'user-1',
    email: 'user@example.com',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
};

describe('POST /api/resume-requests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getSession.mockResolvedValue({
            data: { session: { access_token: 'user-jwt' } },
        });
        createResumeRequest.mockResolvedValue({
            id: 'req-1',
            userId: 'user-1',
            userEmail: 'user@example.com',
            status: 'pending',
            downloadCount: 0,
            createdAt: '2026-07-03T00:00:00.000Z',
        });
    });

    it('returns 401 when there is no session', async () => {
        getUser.mockResolvedValue({ data: { user: null } });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ reason: 'hi' }));
        expect((res as Response).status).toBe(401);
        expect(createResumeRequest).not.toHaveBeenCalled();
    });

    it('returns 403 when the email is not confirmed', async () => {
        getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'user-1',
                    email: 'user@example.com',
                    email_confirmed_at: null,
                    confirmed_at: null,
                },
            },
        });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ reason: 'hi' }));
        expect((res as Response).status).toBe(403);
        expect(createResumeRequest).not.toHaveBeenCalled();
    });

    it('creates the request (201) and forwards the caller JWT + reason', async () => {
        getUser.mockResolvedValue({ data: { user: verifiedUser } });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ reason: '  Considering you  ' }));
        expect((res as Response).status).toBe(201);
        const json = await (res as Response).json();
        expect(json.id).toBe('req-1');
        expect(createResumeRequest).toHaveBeenCalledWith('user-jwt', {
            reason: 'Considering you',
        });
    });

    it('maps a backend quota rejection (429) to a friendly 429', async () => {
        getUser.mockResolvedValue({ data: { user: verifiedUser } });
        createResumeRequest.mockRejectedValueOnce({
            response: { status: 429 },
        });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ reason: 'again' }));
        expect((res as Response).status).toBe(429);
        const json = await (res as Response).json();
        expect(json.error).toMatch(/limit of 3 requests/i);
    });

    it('maps other 4xx backend rejections to the friendly 429', async () => {
        getUser.mockResolvedValue({ data: { user: verifiedUser } });
        createResumeRequest.mockRejectedValueOnce({
            response: { status: 400 },
        });
        const { POST } = await import('../route');
        const res = await POST(makeReq({}));
        expect((res as Response).status).toBe(429);
    });

    it('rejects an over-long reason with a 400 field error', async () => {
        getUser.mockResolvedValue({ data: { user: verifiedUser } });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ reason: 'x'.repeat(501) }));
        expect((res as Response).status).toBe(400);
        const json = await (res as Response).json();
        expect(json.fieldErrors.reason).toBeTruthy();
        expect(createResumeRequest).not.toHaveBeenCalled();
    });

    it('accepts an empty body (no reason)', async () => {
        getUser.mockResolvedValue({ data: { user: verifiedUser } });
        const { POST } = await import('../route');
        const res = await POST(makeReq(''));
        expect((res as Response).status).toBe(201);
        expect(createResumeRequest).toHaveBeenCalledWith('user-jwt', {
            reason: undefined,
        });
    });
});
