import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isPendingInvite } from '@/lib/admin-users';

/**
 * DELETE /api/admin/invites/[id]
 *
 * Revokes a PENDING invite by deleting the not-yet-confirmed user. Gated by
 * `requireAdmin()` BEFORE any service-role use.
 *
 * SAFEGUARD: the target user is re-fetched and its status checked before
 * deletion. Only `invited`/`unconfirmed` users may be revoked; an `active`
 * account (e.g. an active admin) is never deleted via this route — it returns
 * 409 instead.
 */
export async function DELETE(
    _req: NextRequest,
    context: { params: { id: string } | Promise<{ id: string }> },
) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const admin = getAdminSupabase();
    if (!admin.ok) {
        return NextResponse.json(
            { error: 'Admin user management is not configured.' },
            { status: 503 },
        );
    }

    const params = await context.params;
    const id = params.id;
    if (!id) {
        return NextResponse.json(
            { error: 'A user id is required.' },
            { status: 400 },
        );
    }

    try {
        const { data, error } = await admin.client.auth.admin.getUserById(id);
        if (error || !data?.user) {
            return NextResponse.json(
                { error: 'Invite not found.' },
                { status: 404 },
            );
        }

        // Safeguard: never delete an active account through the revoke flow.
        if (!isPendingInvite(data.user)) {
            return NextResponse.json(
                {
                    error: 'Cannot revoke an active user. Only pending invites can be revoked.',
                },
                { status: 409 },
            );
        }

        const { error: deleteError } =
            await admin.client.auth.admin.deleteUser(id);
        if (deleteError) {
            console.error('Admin: failed to revoke invite', {
                name: deleteError.name,
            });
            return NextResponse.json(
                { error: 'Failed to revoke invite.' },
                { status: 502 },
            );
        }

        return new NextResponse(null, { status: 204 });
    } catch (e) {
        console.error('Admin: unexpected error revoking invite', e);
        return NextResponse.json(
            { error: 'Failed to revoke invite.' },
            { status: 502 },
        );
    }
}
