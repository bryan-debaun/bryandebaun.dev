import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth callback handler for Supabase authentication flows
 * Handles both passwordless login and password reset
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const error_description = searchParams.get('error_description')

    // If there's an error from Supabase, redirect to login with error
    if (error_description) {
        console.error('Auth callback error from Supabase:', error_description)
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description)}`, origin))
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Redirect to the specified path (could be /reset-password for password resets)
            const redirectUrl = new URL(next, origin)
            return NextResponse.redirect(redirectUrl)
        }

        // If there was an error, redirect to login with error parameter
        console.error('Auth callback error:', error)
    }

    // If no code or error occurred, redirect to login
    return NextResponse.redirect(new URL('/login?error=callback', origin))
}
