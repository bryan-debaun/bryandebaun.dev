import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'admin-jwt' } },
            }),
        },
    }),
}));

const denyResumeRequest = vi.fn();
vi.mock('@/lib/services/resume-requests', () => ({
    denyResumeRequest: (...args: unknown[]) => denyResumeRequest(...args),
}));

import { requireAdmin } from '@/lib/auth-guard';

const requireAdminMock = requireAdmin as ReturnType<typeof vi.fn>;

const unauthorized = new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
});

function makeReq(body?: unknown) {
    return new Request(
        'http://localhost/api/admin/resume-requests/req-1/deny',
        {
            method: 'PATCH',
            body: body === undefined ? undefined : JSON.stringify(body),
            headers: { 'content-type': 'application/json' },
        },
    ) as unknown as NextRequest;
}

const ctx = { params: { id: 'req-1' } };

const denied = {
    id: 'req-1',
    userId: 'user-1',
    userEmail: 'user@example.com',
    status: 'denied',
    downloadCount: 0,
    createdAt: '2026-07-03T00:00:00.000Z',
    adminNote: 'not now',
};

describe('PATCH /api/admin/resume-requests/[id]/deny', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requireAdminMock.mockResolvedValue(null);
        denyResumeRequest.mockResolvedValue(denied);
    });

    it('returns 401 when not authenticated', async () => {
        requireAdminMock.mockResolvedValueOnce(unauthorized);
        const { PATCH } = await import('../route');
        const res = await PATCH(makeReq({ note: 'x' }), ctx);
        expect((res as Response).status).toBe(401);
        expect(denyResumeRequest).not.toHaveBeenCalled();
    });

    it('denies the request and forwards the admin note', async () => {
        const { PATCH } = await import('../route');
        const res = await PATCH(makeReq({ note: '  not now  ' }), ctx);
        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.request.status).toBe('denied');
        expect(denyResumeRequest).toHaveBeenCalledWith('admin-jwt', 'req-1', {
            adminNote: 'not now',
        });
    });

    it('returns 502 when the backend deny call fails', async () => {
        denyResumeRequest.mockRejectedValueOnce(new Error('boom'));
        const { PATCH } = await import('../route');
        const res = await PATCH(makeReq({}), ctx);
        expect((res as Response).status).toBe(502);
    });
});
