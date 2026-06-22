import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Read the RBAC role from a Supabase user's `app_metadata`.
 *
 * `app_metadata` is admin-controlled and is the SECURE location for authorization.
 * `user_metadata` is user-editable, so trusting it for authorization would be a
 * privilege-escalation risk. This mirrors the MCP server's `roleFromToken`
 * (src/auth/jwt.ts), keeping both repos aligned on one source of truth.
 */
function roleFromAppMetadata(
    appMetadata: Record<string, unknown> | undefined,
): unknown {
    return appMetadata?.role;
}

/**
 * Returns a 401/403 NextResponse if the caller is not an authenticated admin,
 * or null if the caller is allowed to proceed.
 *
 * Usage in route handlers:
 *   const guard = await requireAdmin();
 *   if (guard) return guard;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = roleFromAppMetadata(
        user.app_metadata as Record<string, unknown> | undefined,
    );
    if (role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null;
}

/**
 * Page-oriented admin guard: the `redirect()` analog of {@link requireAdmin}.
 *
 * Reads the role from the SECURE `app_metadata.role` (never user-editable
 * `user_metadata`). Use this at the top of a server-component admin page:
 *
 *   export default async function AdminPage() {
 *     await requireAdminPage();
 *     // ...render admin UI
 *   }
 *
 * Redirects unauthenticated callers to `/login` and authenticated-but-non-admin
 * callers to `/`. Both throw Next's redirect signal, so code after the call only
 * runs for an authenticated admin. Returns the authenticated admin user so the
 * page can use it without re-fetching.
 */
export async function requireAdminPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const role = roleFromAppMetadata(
        user.app_metadata as Record<string, unknown> | undefined,
    );
    if (role !== 'admin') {
        redirect('/');
    }

    return user;
}
