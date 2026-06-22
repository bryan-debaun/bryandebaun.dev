import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function mockListUsers(users: unknown[]) {
    getAdminSupabaseMock.mockReturnValue({
        ok: true,
        client: {
            auth: {
                admin: {
                    listUsers: vi
                        .fn()
                        .mockResolvedValue({ data: { users }, error: null }),
                },
            },
        },
    });
}

describe('GET /api/admin/users', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requireAdminMock.mockResolvedValue(null);
    });

    it('returns 401 when unauthenticated', async () => {
        requireAdminMock.mockResolvedValueOnce(unauthorized);
        const { GET } = await import('../route');
        const res = await GET();
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        requireAdminMock.mockResolvedValueOnce(forbidden);
        const { GET } = await import('../route');
        const res = await GET();
        expect((res as Response).status).toBe(403);
    });

    it('returns 503 when the service-role client is unconfigured', async () => {
        getAdminSupabaseMock.mockReturnValue({
            ok: false,
            reason: 'unconfigured',
        });
        const { GET } = await import('../route');
        const res = await GET();
        expect((res as Response).status).toBe(503);
        const json = await (res as Response).json();
        expect(json.error).toBe('Admin user management is not configured.');
    });

    it('lists users mapped to AdminUserView on success', async () => {
        mockListUsers([
            {
                id: 'u1',
                email: 'admin@example.com',
                app_metadata: { role: 'admin' },
                user_metadata: {},
                created_at: '2026-01-01T00:00:00.000Z',
                email_confirmed_at: '2026-01-02T00:00:00.000Z',
                last_sign_in_at: '2026-03-01T00:00:00.000Z',
            },
            {
                id: 'u2',
                email: 'invitee@example.com',
                app_metadata: {},
                user_metadata: {},
                created_at: '2026-02-01T00:00:00.000Z',
                invited_at: '2026-02-01T00:00:00.000Z',
            },
        ]);
        const { GET } = await import('../route');
        const res = await GET();
        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.users).toHaveLength(2);
        expect(json.users[0]).toMatchObject({
            id: 'u1',
            role: 'admin',
            status: 'active',
        });
        expect(json.users[1]).toMatchObject({
            id: 'u2',
            role: null,
            status: 'invited',
        });
    });

    it('returns 502 when listUsers errors', async () => {
        getAdminSupabaseMock.mockReturnValue({
            ok: true,
            client: {
                auth: {
                    admin: {
                        listUsers: vi.fn().mockResolvedValue({
                            data: null,
                            error: { name: 'AuthApiError' },
                        }),
                    },
                },
            },
        });
        const { GET } = await import('../route');
        const res = await GET();
        expect((res as Response).status).toBe(502);
    });
});
