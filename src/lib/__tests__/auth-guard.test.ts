import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';

describe('requireAdmin', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns 401 when no user is authenticated', async () => {
        (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            },
        });

        const result = await requireAdmin();

        expect(result).not.toBeNull();
        expect(result?.status).toBe(401);
        const body = await result!.json();
        expect(body.error).toBe('Unauthorized');
    });

    it('returns 403 when user exists but is not admin', async () => {
        (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { app_metadata: { role: 'viewer' } } },
                }),
            },
        });

        const result = await requireAdmin();

        expect(result).not.toBeNull();
        expect(result?.status).toBe(403);
        const body = await result!.json();
        expect(body.error).toBe('Forbidden');
    });

    it('returns 403 when user has no role in metadata', async () => {
        (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { app_metadata: {} } },
                }),
            },
        });

        const result = await requireAdmin();

        expect(result).not.toBeNull();
        expect(result?.status).toBe(403);
    });

    it('does not grant admin from user-editable user_metadata (privilege-escalation guard)', async () => {
        (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: {
                        user: {
                            user_metadata: { role: 'admin' },
                            app_metadata: {},
                        },
                    },
                }),
            },
        });

        const result = await requireAdmin();

        expect(result).not.toBeNull();
        expect(result?.status).toBe(403);
    });

    it('returns null when user is an admin via app_metadata', async () => {
        (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { app_metadata: { role: 'admin' } } },
                }),
            },
        });

        const result = await requireAdmin();

        expect(result).toBeNull();
    });
});
