import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { toAdminUserView, type AdminUserView } from '@/lib/admin-users';

/**
 * GET /api/admin/users
 *
 * Lists all Supabase auth users (admin-only), mapped to the client-safe
 * {@link AdminUserView}. Gated by `requireAdmin()` BEFORE any service-role use.
 * Returns 503 when the service-role client is unconfigured.
 */
export async function GET() {
    const guard = await requireAdmin();
    if (guard) return guard;

    const admin = getAdminSupabase();
    if (!admin.ok) {
        return NextResponse.json(
            { error: 'Admin user management is not configured.' },
            { status: 503 },
        );
    }

    try {
        const { data, error } = await admin.client.auth.admin.listUsers();
        if (error) {
            console.error('Admin: failed to list users', { name: error.name });
            return NextResponse.json(
                { error: 'Failed to list users' },
                { status: 502 },
            );
        }

        const users: AdminUserView[] = data.users.map(toAdminUserView);
        return NextResponse.json({ users });
    } catch (e) {
        console.error('Admin: unexpected error listing users', e);
        return NextResponse.json(
            { error: 'Failed to list users' },
            { status: 502 },
        );
    }
}
