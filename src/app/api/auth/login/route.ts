import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0')

    try {
        const { email, password } = await req.json()
        const maskedEmail = email ? email.replace(/(.{2}).+(@.+)/, '$1***$2') : undefined

        if (debug) {
            console.info('auth.login: attempting password login', { email: maskedEmail })
        }

        const supabase = await createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            if (debug) {
                console.error('auth.login: failed', { email: maskedEmail, error: error.message })
            }
            return NextResponse.json({ error: error.message }, { status: 401 })
        }

        if (debug) {
            console.info('auth.login: success', { email: maskedEmail, userId: data.user?.id })
        }

        return NextResponse.json({ user: data.user, session: data.session })
    } catch (e) {
        const error = e as Error
        if (debug) {
            console.error('auth.login: exception', { error: error.message })
        }
        return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
    }
}
