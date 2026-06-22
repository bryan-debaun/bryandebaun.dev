import type { AdminUserView } from '@/lib/admin-users';

/**
 * Client-side repository for admin user/invite operations. Talks to the admin
 * API routes (which enforce auth + use the server-only service-role client).
 */

export interface InviteResult {
    id: string;
    email: string;
    emailSent: boolean;
    inviteUrl: string;
}

/** Fetch the admin users list. */
export async function listAdminUsers(): Promise<AdminUserView[]> {
    const res = await fetch('/api/admin/users');
    if (!res.ok) {
        if (res.status === 503) {
            throw new Error('Admin user management is not configured.');
        }
        throw new Error(`Failed to fetch users: ${res.status}`);
    }
    const data = (await res.json()) as { users: AdminUserView[] };
    return data.users ?? [];
}

/** Create an invite for the given email. */
export async function createInvite(email: string): Promise<InviteResult> {
    const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = (await res.json().catch(() => null)) as
        | (InviteResult & { error?: string })
        | { error?: string }
        | null;
    if (!res.ok) {
        const message =
            (data && 'error' in data && data.error) ||
            `Failed to create invite: ${res.status}`;
        throw new Error(message);
    }
    return data as InviteResult;
}

/** Revoke a pending invite by user id. */
export async function revokeInvite(id: string): Promise<void> {
    const res = await fetch(`/api/admin/invites/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
        const data = (await res.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(
            data?.error ?? `Failed to revoke invite: ${res.status}`,
        );
    }
}
