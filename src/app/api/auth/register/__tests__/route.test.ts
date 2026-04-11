import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        process.env.DEBUG_AUTH = '1'
        process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
    })

    it('calls Supabase signUp and returns user/session on success', async () => {
        const { createClient } = await import('@/lib/supabase/server')
        const mockSignUp = vi.fn().mockResolvedValue({
            data: { user: { id: '123', email: 'test@example.com' }, session: { access_token: 'token' } },
            error: null,
        })
            ; (createClient as any).mockResolvedValue({
                auth: { signUp: mockSignUp },
            })

        const route = await import('../route')
        const req = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'securepassword' }),
            headers: { 'content-type': 'application/json' },
        })
        const res = await route.POST(req as unknown as NextRequest)

        expect(res.status).toBe(200)
        const json = await (res as Response).json()
        expect(json).toHaveProperty('user')
        expect(json).toHaveProperty('session')
        expect(mockSignUp).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'securepassword',
            options: {
                emailRedirectTo: 'http://localhost:3000/auth/callback',
            },
        })
    })

    it('returns 400 when Supabase returns an error', async () => {
        const { createClient } = await import('@/lib/supabase/server')
        const mockSignUp = vi.fn().mockResolvedValue({ data: {}, error: { message: 'Email already registered' } })
            ; (createClient as any).mockResolvedValue({
                auth: { signUp: mockSignUp },
            })

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const route = await import('../route')
        const req = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'bad@example.com', password: 'pw' }),
            headers: { 'content-type': 'application/json' },
        })
        const res = await route.POST(req as unknown as NextRequest)

        expect(res.status).toBe(400)
        const json = await (res as Response).json()
        expect(json).toEqual({ error: 'Email already registered' })
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('auth.register: failed'),
            expect.any(Object)
        )
        spy.mockRestore()
    })

    it('logs less detail in production (no DEBUG_AUTH)', async () => {
        const { createClient } = await import('@/lib/supabase/server')
        process.env.DEBUG_AUTH = '0' // simulate production (force debug off)
        const mockSignUp = vi.fn().mockResolvedValue({
            data: {},
            error: { message: 'Service error' },
        })
            ; (createClient as any).mockResolvedValue({
                auth: { signUp: mockSignUp },
            })

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const route = await import('../route')
        const req = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'prod@example.com', password: 'x' }),
            headers: { 'content-type': 'application/json' },
        })
        const res = await route.POST(req as unknown as NextRequest)

        expect(res.status).toBe(400)
        const json = await (res as Response).json()
        expect(json).toEqual({ error: 'Service error' })
        // In production mode, logs should be minimal (no DEBUG_AUTH)
        expect(spy).not.toHaveBeenCalled()
        spy.mockRestore()
    })

    it('returns 500 and logs when signUp throws', async () => {
        const { createClient } = await import('@/lib/supabase/server')
            ; (createClient as any).mockRejectedValue(new Error('network'))

        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const route = await import('../route')
        const req = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: 'x@y.com', password: 'pw' }),
            headers: { 'content-type': 'application/json' },
        })
        const res = await route.POST(req as unknown as NextRequest)

        expect(res.status).toBe(500)
        const json = await (res as Response).json()
        expect(json).toEqual({ error: 'Failed to register' })
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('auth.register: exception'),
            expect.any(Object)
        )
        spy.mockRestore()
    })
})
