import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the email helper so no real email is ever sent in tests.
vi.mock('@/lib/email', () => ({
    sendContactEmail: vi.fn(),
}));

function makeReq(body: unknown, headers: Record<string, string> = {}) {
    return new Request('http://localhost/api/contact', {
        method: 'POST',
        body: typeof body === 'string' ? body : JSON.stringify(body),
        headers: { 'content-type': 'application/json', ...headers },
    }) as unknown as NextRequest;
}

const validBody = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Hello there, I would love to connect.',
    company: '',
};

describe('POST /api/contact', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sends the email and returns 200 on a valid submission', async () => {
        const { sendContactEmail } = await import('@/lib/email');
        (sendContactEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
        });

        const { POST } = await import('../route');
        const res = await POST(makeReq(validBody));

        expect(res.status).toBe(200);
        await expect((res as Response).json()).resolves.toEqual({ ok: true });
        expect(sendContactEmail).toHaveBeenCalledWith({
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            message: 'Hello there, I would love to connect.',
        });
    });

    it('returns 400 with field errors for invalid input', async () => {
        const { sendContactEmail } = await import('@/lib/email');
        const { POST } = await import('../route');
        const res = await POST(
            makeReq({ name: '', email: 'not-an-email', message: '', company: '' }),
        );

        expect(res.status).toBe(400);
        const json = await (res as Response).json();
        expect(json.error).toBe('Validation failed.');
        expect(json.fieldErrors).toMatchObject({
            name: expect.any(String),
            email: expect.any(String),
            message: expect.any(String),
        });
        expect(sendContactEmail).not.toHaveBeenCalled();
    });

    it('rejects a message that exceeds the max length (400)', async () => {
        const { sendContactEmail } = await import('@/lib/email');
        const { POST } = await import('../route');
        const res = await POST(
            makeReq({ ...validBody, message: 'x'.repeat(5001) }),
        );

        expect(res.status).toBe(400);
        const json = await (res as Response).json();
        expect(json.fieldErrors).toHaveProperty('message');
        expect(sendContactEmail).not.toHaveBeenCalled();
    });

    it('silently returns 200 without sending when the honeypot is filled', async () => {
        const { sendContactEmail } = await import('@/lib/email');
        const { POST } = await import('../route');
        const res = await POST(
            makeReq({ ...validBody, company: 'spam-bot-co' }),
        );

        expect(res.status).toBe(200);
        await expect((res as Response).json()).resolves.toEqual({ ok: true });
        expect(sendContactEmail).not.toHaveBeenCalled();
    });

    it('maps an unconfigured email backend to 503', async () => {
        const { sendContactEmail } = await import('@/lib/email');
        (sendContactEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            reason: 'unconfigured',
        });

        const { POST } = await import('../route');
        const res = await POST(makeReq(validBody));

        expect(res.status).toBe(503);
        await expect((res as Response).json()).resolves.toEqual({
            error: 'Email delivery is not configured.',
        });
    });

    it('maps a send failure to 502', async () => {
        const { sendContactEmail } = await import('@/lib/email');
        (sendContactEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            reason: 'send_failed',
            detail: 'boom',
        });

        const { POST } = await import('../route');
        const res = await POST(makeReq(validBody));

        expect(res.status).toBe(502);
    });

    it('returns 400 on malformed JSON', async () => {
        const { POST } = await import('../route');
        const res = await POST(makeReq('{not json'));

        expect(res.status).toBe(400);
    });

    it('rejects an oversized body with 413 before parsing', async () => {
        const { sendContactEmail } = await import('@/lib/email');
        const { POST } = await import('../route');
        const res = await POST(
            makeReq(validBody, { 'content-length': String(200 * 1024) }),
        );

        expect(res.status).toBe(413);
        expect(sendContactEmail).not.toHaveBeenCalled();
    });
});
