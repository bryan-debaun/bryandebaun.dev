import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';
import {
    isPendingInvite,
    roleFromUser,
    statusFromUser,
    toAdminUserView,
} from '@/lib/admin-users';

function makeUser(overrides: Partial<User> = {}): User {
    return {
        id: 'user-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00.000Z',
        ...overrides,
    } as User;
}

describe('roleFromUser', () => {
    it('returns admin from app_metadata.role', () => {
        expect(
            roleFromUser(makeUser({ app_metadata: { role: 'admin' } })),
        ).toBe('admin');
    });

    it('returns user from app_metadata.role', () => {
        expect(roleFromUser(makeUser({ app_metadata: { role: 'user' } }))).toBe(
            'user',
        );
    });

    it('returns null when no role is set', () => {
        expect(roleFromUser(makeUser({ app_metadata: {} }))).toBeNull();
    });

    it('returns null for an unknown role value', () => {
        expect(
            roleFromUser(makeUser({ app_metadata: { role: 'superuser' } })),
        ).toBeNull();
    });

    it('NEVER reads role from user-editable user_metadata (privilege-escalation guard)', () => {
        const user = makeUser({
            app_metadata: {},
            user_metadata: { role: 'admin' },
        });
        expect(roleFromUser(user)).toBeNull();
    });
});

describe('statusFromUser', () => {
    it('returns invited when invited_at is set and email is unconfirmed', () => {
        expect(
            statusFromUser(
                makeUser({ invited_at: '2026-02-01T00:00:00.000Z' }),
            ),
        ).toBe('invited');
    });

    it('returns unconfirmed when never invited and never confirmed', () => {
        expect(statusFromUser(makeUser())).toBe('unconfirmed');
    });

    it('returns active when email is confirmed (even if previously invited)', () => {
        expect(
            statusFromUser(
                makeUser({
                    invited_at: '2026-02-01T00:00:00.000Z',
                    email_confirmed_at: '2026-02-02T00:00:00.000Z',
                }),
            ),
        ).toBe('active');
    });

    it('returns active when confirmed without an invite', () => {
        expect(
            statusFromUser(
                makeUser({ email_confirmed_at: '2026-02-02T00:00:00.000Z' }),
            ),
        ).toBe('active');
    });
});

describe('isPendingInvite', () => {
    it('is true for invited and unconfirmed users', () => {
        expect(
            isPendingInvite(
                makeUser({ invited_at: '2026-02-01T00:00:00.000Z' }),
            ),
        ).toBe(true);
        expect(isPendingInvite(makeUser())).toBe(true);
    });

    it('is false for an active user (cannot be revoked)', () => {
        expect(
            isPendingInvite(
                makeUser({ email_confirmed_at: '2026-02-02T00:00:00.000Z' }),
            ),
        ).toBe(false);
    });
});

describe('toAdminUserView', () => {
    it('maps a confirmed admin to an active view', () => {
        const view = toAdminUserView(
            makeUser({
                id: 'abc',
                email: 'admin@example.com',
                app_metadata: { role: 'admin' },
                email_confirmed_at: '2026-02-02T00:00:00.000Z',
                last_sign_in_at: '2026-03-01T00:00:00.000Z',
            }),
        );
        expect(view).toEqual({
            id: 'abc',
            email: 'admin@example.com',
            role: 'admin',
            status: 'active',
            createdAt: '2026-01-01T00:00:00.000Z',
            lastSignInAt: '2026-03-01T00:00:00.000Z',
            invitedAt: null,
        });
    });

    it('maps a pending invite with no role/sign-in to nulls', () => {
        const view = toAdminUserView(
            makeUser({
                id: 'def',
                email: 'invitee@example.com',
                invited_at: '2026-02-01T00:00:00.000Z',
            }),
        );
        expect(view.role).toBeNull();
        expect(view.status).toBe('invited');
        expect(view.lastSignInAt).toBeNull();
        expect(view.invitedAt).toBe('2026-02-01T00:00:00.000Z');
    });

    it('handles a missing email gracefully', () => {
        expect(
            toAdminUserView(makeUser({ email: undefined })).email,
        ).toBeNull();
    });
});
