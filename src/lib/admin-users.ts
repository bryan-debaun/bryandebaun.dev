import type { User } from '@supabase/supabase-js';

/**
 * RBAC role as stored in the SECURE `app_metadata.role`. `null` means no role
 * has been assigned (a normal, non-admin account).
 */
export type AdminUserRole = 'admin' | 'user' | null;

/**
 * Derived account status for the admin users list:
 *  - `invited`     — invite issued (`invited_at` set) but not yet confirmed.
 *  - `unconfirmed` — created but email never confirmed (and not via invite).
 *  - `active`      — email confirmed; a fully onboarded account.
 */
export type AdminUserStatus = 'active' | 'invited' | 'unconfirmed';

/**
 * Flattened, client-safe view of a Supabase auth user for the admin UI. Contains
 * only non-sensitive fields (no tokens, no raw metadata).
 */
export interface AdminUserView {
    id: string;
    email: string | null;
    role: AdminUserRole;
    status: AdminUserStatus;
    createdAt: string | null;
    lastSignInAt: string | null;
    invitedAt: string | null;
}

/**
 * Map the role from a user's `app_metadata`. Only the two known RBAC roles are
 * surfaced; anything else (including absent) becomes `null`.
 *
 * SECURITY: reads `app_metadata` (admin-controlled), never the user-editable
 * `user_metadata`.
 */
export function roleFromUser(user: Pick<User, 'app_metadata'>): AdminUserRole {
    const raw = (user.app_metadata as Record<string, unknown> | undefined)
        ?.role;
    if (raw === 'admin') return 'admin';
    if (raw === 'user') return 'user';
    return null;
}

/**
 * Derive the account status from confirmation/invite timestamps.
 *
 * Rules (in order):
 *  1. `invited_at` set AND not yet confirmed ⇒ `invited`.
 *  2. otherwise not confirmed ⇒ `unconfirmed`.
 *  3. otherwise ⇒ `active`.
 */
export function statusFromUser(
    user: Pick<User, 'invited_at' | 'email_confirmed_at'>,
): AdminUserStatus {
    const confirmed = Boolean(user.email_confirmed_at);
    if (!confirmed && user.invited_at) {
        return 'invited';
    }
    if (!confirmed) {
        return 'unconfirmed';
    }
    return 'active';
}

/**
 * True when a user is a still-pending invite/unconfirmed account that is safe to
 * revoke (delete). An `active` account must never be deleted via the invite
 * revoke flow.
 */
export function isPendingInvite(
    user: Pick<User, 'invited_at' | 'email_confirmed_at'>,
): boolean {
    return statusFromUser(user) !== 'active';
}

/**
 * Map a raw Supabase `User` to the flattened, client-safe {@link AdminUserView}.
 * Pure and unit-testable; performs no I/O.
 */
export function toAdminUserView(user: User): AdminUserView {
    return {
        id: user.id,
        email: user.email ?? null,
        role: roleFromUser(user),
        status: statusFromUser(user),
        createdAt: user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        invitedAt: user.invited_at ?? null,
    };
}
