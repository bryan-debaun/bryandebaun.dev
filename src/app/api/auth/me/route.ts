import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const debug =
        process.env.DEBUG_AUTH === '1' ||
        (process.env.NODE_ENV !== 'production' &&
            process.env.DEBUG_AUTH !== '0');

    try {
        if (debug) {
            console.info('auth.me: fetching current user');
        }

        const supabase = await createClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            if (debug) {
                console.error('auth.me: failed', { error: error.message });
            }
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (!user) {
            if (debug) {
                console.info('auth.me: no user session');
            }
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 },
            );
        }

        if (debug) {
            console.info('auth.me: success', { userId: user.id });
        }

        // Return a minimal projection rather than the raw Supabase user object,
        // which carries app_metadata/user_metadata/identities/tokens the client
        // has no need for. `isAdmin` is computed server-side from the SECURE
        // app_metadata.role (admin-controlled) — never user_metadata, which is
        // user-editable and must not be trusted for authorization. Mirrors the
        // role source used by requireAdmin (src/lib/auth-guard.ts).
        const isAdmin =
            (user.app_metadata as Record<string, unknown> | undefined)?.role ===
            'admin';
        return NextResponse.json({
            user: { id: user.id, email: user.email, isAdmin },
        });
    } catch (e) {
        const error = e as Error;
        if (debug) {
            console.error('auth.me: exception', { error: error.message });
        }
        return NextResponse.json(
            { error: 'Failed to fetch session' },
            { status: 500 },
        );
    }
}
