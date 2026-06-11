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

        return NextResponse.json({ user });
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
