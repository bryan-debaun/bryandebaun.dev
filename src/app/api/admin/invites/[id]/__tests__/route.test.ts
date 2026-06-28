import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/supabase/admin', () => ({
    getAdminSupabase: vi.fn(),
}));

import { requireAdmin } from '@/lib/auth-guard';
import { getAdminSupabase } from '@/lib/supabase/admin';

const requireAdminMock = requireAdmin as ReturnType<typeof vi.fn>;
const getAdminSupabaseMock = getAdminSupabase as ReturnType<typeof vi.fn>;

const unauthorized = new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
});
const forbidden = new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
});

function makeReq() {
    return new Request('http://localhost/api/admin/invites/u1', {
        method: 'DELETE',
    }) as unknown as NextRequest;
}

function mockClient(opts: {
    getUserResult: { data?: unknown; error?: unknown };
    deleteResult?: { error?: unknown };
}) {
    const deleteUser = vi
        .fn()
        .mockResolvedValue(opts.deleteResult ?? { error: null });
    getAdminSupabaseMock.mockReturnValue({
        ok: true,
        client: {
            auth: {
                admin: {
                    getUserById: vi.fn().mockResolvedValue(opts.getUserResult),
                    deleteUser,
                },
            },
        },
    });
    return { deleteUser };
}

describe('DELETE /api/admin/invites/[id]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requireAdminMock.mockResolvedValue(null);
    });

    it('returns 401 when unauthenticated', async () => {
        requireAdminMock.mockResolvedValueOnce(unauthorized);
        const { DELETE } = await import('../route');
        const res = await DELETE(makeReq(), { params: { id: 'u1' } });
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        requireAdminMock.mockResolvedValueOnce(forbidden);
        const { DELETE } = await import('../route');
        const res = await DELETE(makeReq(), { params: { id: 'u1' } });
        expect((res as Response).status).toBe(403);
    });

    it('returns 503 when the service-role client is unconfigured', async () => {
        getAdminSupabaseMock.mockReturnValue({
            ok: false,
            reason: 'unconfigured',
        });
        const { DELETE } = await import('../route');
        const res = await DELETE(makeReq(), { params: { id: 'u1' } });
        expect((res as Response).status).toBe(503);
    });

    it('revokes a pending invite and returns 204', async () => {
        const { deleteUser } = mockClient({
            getUserResult: {
                data: {
                    user: {
                        id: 'u1',
                        invited_at: '2026-02-01T00:00:00.000Z',
                    },
                },
                error: null,
            },
        });
        const { DELETE } = await import('../route');
        const res = await DELETE(makeReq(), { params: { id: 'u1' } });
        expect((res as Response).status).toBe(204);
        expect(deleteUser).toHaveBeenCalledWith('u1');
    });

    it('returns 409 and does NOT delete an active user', async () => {
        const { deleteUser } = mockClient({
            getUserResult: {
                data: {
                    user: {
                        id: 'u1',
                        email_confirmed_at: '2026-02-02T00:00:00.000Z',
                    },
                },
                error: null,
            },
        });
        const { DELETE } = await import('../route');
        const res = await DELETE(makeReq(), { params: { id: 'u1' } });
        expect((res as Response).status).toBe(409);
        expect(deleteUser).not.toHaveBeenCalled();
    });

    it('returns 404 when the target user does not exist', async () => {
        mockClient({
            getUserResult: { data: { user: null }, error: null },
        });
        const { DELETE } = await import('../route');
        const res = await DELETE(makeReq(), { params: { id: 'missing' } });
        expect((res as Response).status).toBe(404);
    });
});
