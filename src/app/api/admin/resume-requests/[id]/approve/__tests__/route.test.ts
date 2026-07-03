import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'admin-jwt' } },
            }),
        },
    }),
}));

const approveResumeRequest = vi.fn();
vi.mock('@/lib/services/resume-requests', () => ({
    approveResumeRequest: (...args: unknown[]) => approveResumeRequest(...args),
}));

const sendResumeApprovalEmail = vi.fn();
vi.mock('@/lib/email', () => ({
    sendResumeApprovalEmail: (...args: unknown[]) =>
        sendResumeApprovalEmail(...args),
}));

const signResumeDownloadLink = vi.fn();
vi.mock('@/lib/resume-download', () => ({
    signResumeDownloadLink: (...args: unknown[]) =>
        signResumeDownloadLink(...args),
}));

import { requireAdmin } from '@/lib/auth-guard';

const requireAdminMock = requireAdmin as ReturnType<typeof vi.fn>;

const forbidden = new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
});

function makeReq(body?: unknown) {
    return new Request(
        'http://localhost/api/admin/resume-requests/req-1/approve',
        {
            method: 'PATCH',
            body: body === undefined ? undefined : JSON.stringify(body),
            headers: { 'content-type': 'application/json' },
        },
    ) as unknown as NextRequest;
}

const ctx = { params: { id: 'req-1' } };

const approved = {
    id: 'req-1',
    userId: 'user-1',
    userEmail: 'user@example.com',
    status: 'approved',
    downloadCount: 0,
    createdAt: '2026-07-03T00:00:00.000Z',
    approvedAt: '2026-07-03T01:00:00.000Z',
    expiresAt: '2026-07-06T01:00:00.000Z',
};

describe('PATCH /api/admin/resume-requests/[id]/approve', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requireAdminMock.mockResolvedValue(null);
        approveResumeRequest.mockResolvedValue(approved);
        signResumeDownloadLink.mockReturnValue('signed-token');
        sendResumeApprovalEmail.mockResolvedValue({ ok: true });
    });

    it('returns 403 when not admin', async () => {
        requireAdminMock.mockResolvedValueOnce(forbidden);
        const { PATCH } = await import('../route');
        const res = await PATCH(makeReq({ note: 'x' }), ctx);
        expect((res as Response).status).toBe(403);
        expect(approveResumeRequest).not.toHaveBeenCalled();
    });

    it('approves, signs a link, emails the requester, and returns emailSent true', async () => {
        const { PATCH } = await import('../route');
        const res = await PATCH(makeReq({ note: 'looks good' }), ctx);
        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.request.id).toBe('req-1');
        expect(json.emailSent).toBe(true);

        expect(approveResumeRequest).toHaveBeenCalledWith(
            'admin-jwt',
            'req-1',
            {
                adminNote: 'looks good',
            },
        );
        expect(signResumeDownloadLink).toHaveBeenCalledWith({
            requestId: 'req-1',
            expiresAt: approved.expiresAt,
        });
        expect(sendResumeApprovalEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'user@example.com',
                expiresAt: approved.expiresAt,
            }),
        );
        const arg = sendResumeApprovalEmail.mock.calls[0][0] as {
            downloadUrl: string;
        };
        expect(arg.downloadUrl).toContain(
            '/api/resume/download?t=signed-token',
        );
    });

    it('still returns success with emailSent false when email delivery fails', async () => {
        sendResumeApprovalEmail.mockResolvedValue({
            ok: false,
            reason: 'unconfigured',
        });
        const { PATCH } = await import('../route');
        const res = await PATCH(makeReq({}), ctx);
        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.emailSent).toBe(false);
    });

    it('returns 502 when the backend approve call fails', async () => {
        approveResumeRequest.mockRejectedValueOnce(new Error('boom'));
        const { PATCH } = await import('../route');
        const res = await PATCH(makeReq({}), ctx);
        expect((res as Response).status).toBe(502);
        expect(sendResumeApprovalEmail).not.toHaveBeenCalled();
    });
});
