import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/supabase/admin', () => ({
    getAdminSupabase: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
    sendInviteEmail: vi.fn(),
}));

import { requireAdmin } from '@/lib/auth-guard';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { sendInviteEmail } from '@/lib/email';

const requireAdminMock = requireAdmin as ReturnType<typeof vi.fn>;
const getAdminSupabaseMock = getAdminSupabase as ReturnType<typeof vi.fn>;
const sendInviteEmailMock = sendInviteEmail as ReturnType<typeof vi.fn>;

const unauthorized = new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
});
const forbidden = new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
});

function makeReq(body: unknown) {
    return new Request('http://localhost/api/admin/invites', {
        method: 'POST',
        body: typeof body === 'string' ? body : JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    }) as unknown as NextRequest;
}

function mockGenerateLink(result: { data?: unknown; error?: unknown }) {
    getAdminSupabaseMock.mockReturnValue({
        ok: true,
        client: {
            auth: {
                admin: {
                    generateLink: vi.fn().mockResolvedValue(result),
                },
            },
        },
    });
}

describe('POST /api/admin/invites', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requireAdminMock.mockResolvedValue(null);
        sendInviteEmailMock.mockResolvedValue({ ok: true });
    });

    it('returns 401 when unauthenticated', async () => {
        requireAdminMock.mockResolvedValueOnce(unauthorized);
        const { POST } = await import('../route');
        const res = await POST(makeReq({ email: 'a@b.com' }));
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        requireAdminMock.mockResolvedValueOnce(forbidden);
        const { POST } = await import('../route');
        const res = await POST(makeReq({ email: 'a@b.com' }));
        expect((res as Response).status).toBe(403);
    });

    it('returns 503 when the service-role client is unconfigured', async () => {
        getAdminSupabaseMock.mockReturnValue({
            ok: false,
            reason: 'unconfigured',
        });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ email: 'a@b.com' }));
        expect((res as Response).status).toBe(503);
    });

    it('returns 400 for an invalid email', async () => {
        mockGenerateLink({ data: null, error: null });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ email: 'not-an-email' }));
        expect((res as Response).status).toBe(400);
    });

    it('creates an invite and sends the email (201, emailSent true)', async () => {
        mockGenerateLink({
            data: {
                properties: { action_link: 'https://invite.example/abc' },
                user: { id: 'new-user-1' },
            },
            error: null,
        });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ email: 'Invitee@Example.com' }));
        expect((res as Response).status).toBe(201);
        const json = await (res as Response).json();
        expect(json).toMatchObject({
            id: 'new-user-1',
            email: 'invitee@example.com',
            emailSent: true,
            inviteUrl: 'https://invite.example/abc',
        });
        expect(sendInviteEmailMock).toHaveBeenCalledWith({
            email: 'invitee@example.com',
            inviteUrl: 'https://invite.example/abc',
        });
    });

    it('still returns 201 with emailSent false when Resend is unconfigured', async () => {
        mockGenerateLink({
            data: {
                properties: { action_link: 'https://invite.example/xyz' },
                user: { id: 'new-user-2' },
            },
            error: null,
        });
        sendInviteEmailMock.mockResolvedValue({
            ok: false,
            reason: 'unconfigured',
        });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ email: 'invitee2@example.com' }));
        expect((res as Response).status).toBe(201);
        const json = await (res as Response).json();
        expect(json.emailSent).toBe(false);
        expect(json.inviteUrl).toBe('https://invite.example/xyz');
    });

    it('returns 409 when the user already exists', async () => {
        mockGenerateLink({
            data: null,
            error: { name: 'AuthApiError', code: 'email_exists', status: 422 },
        });
        const { POST } = await import('../route');
        const res = await POST(makeReq({ email: 'dupe@example.com' }));
        expect((res as Response).status).toBe(409);
        expect(sendInviteEmailMock).not.toHaveBeenCalled();
    });
});
