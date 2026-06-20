import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Read the role from app_metadata, NOT user_metadata. user_metadata is
    // user-editable, so trusting it for authorization is a privilege-escalation
    // risk. app_metadata is admin-controlled and is the same secure RBAC location
    // the MCP server checks (src/auth/jwt.ts `roleFromToken`), keeping both repos
    // aligned on one source of truth.
    const role = (user.app_metadata as Record<string, unknown> | undefined)
        ?.role;
    if (role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null;
}
