import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const { password } = await req.json();

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        if (debug) {
            console.info('auth.update-password: updating password');
        }

        const supabase = await createClient();
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            if (debug) {
                console.error('auth.update-password: failed', { error: error.message });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (debug) {
            console.info('auth.update-password: success');
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        const error = e as Error;
        if (debug) {
            console.error('auth.update-password: exception', { error: error.message });
        }
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }
}
