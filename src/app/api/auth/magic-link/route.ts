import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const { email } = await req.json();
        const maskedEmail = email ? email.replace(/(.{2}).+(@.+)/, '$1***$2') : undefined;

        if (debug) {
            console.info('auth.magic-link: sending magic link', { email: maskedEmail });
        }

        const supabase = await createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
        });

        if (error) {
            if (debug) {
                console.error('auth.magic-link: failed', { email: maskedEmail, error: error.message });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (debug) {
            console.info('auth.magic-link: success', { email: maskedEmail });
        }

        // Return 202 Accepted to match security best practice (don't leak email existence)
        return NextResponse.json({ status: 'accepted' }, { status: 202 });
    } catch (e) {
        const error = e as Error;
        if (debug) {
            console.error('auth.magic-link: exception', { error: error.message });
        }
        return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
    }
}
