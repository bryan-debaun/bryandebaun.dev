import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0')

    try {
        if (debug) {
            console.info('auth.logout: attempting logout')
        }

        const supabase = await createClient()
        const { error } = await supabase.auth.signOut()

        if (error) {
            if (debug) {
                console.error('auth.logout: failed', { error: error.message })
            }
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (debug) {
            console.info('auth.logout: success')
        }

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        const error = e as Error
        if (debug) {
            console.error('auth.logout: exception', { error: error.message })
        }
        return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
    }
}
