import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks: `server-only` must be a no-op in the test env, and the
// service-role client is faked so we never touch Supabase.
const { getAdminSupabaseMock, createSignedUrlMock } = vi.hoisted(() => ({
    getAdminSupabaseMock: vi.fn(),
    createSignedUrlMock: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({
    getAdminSupabase: getAdminSupabaseMock,
}));

import {
    getResumeDownloadSignedUrl,
    isValidResumeFullToken,
    RESUME_SIGNED_URL_TTL_SECONDS,
} from '@/lib/resume-download';

describe('isValidResumeFullToken', () => {
    const original = process.env.RESUME_FULL_TOKEN;
    afterEach(() => {
        if (original === undefined) delete process.env.RESUME_FULL_TOKEN;
        else process.env.RESUME_FULL_TOKEN = original;
    });

    it('is false when the feature is unconfigured (no env token)', () => {
        delete process.env.RESUME_FULL_TOKEN;
        expect(isValidResumeFullToken('anything')).toBe(false);
    });

    it('is false for an absent or empty candidate', () => {
        process.env.RESUME_FULL_TOKEN = 'secret-value-123';
        expect(isValidResumeFullToken(null)).toBe(false);
        expect(isValidResumeFullToken(undefined)).toBe(false);
        expect(isValidResumeFullToken('')).toBe(false);
    });

    it('is false for a wrong token, including a length mismatch', () => {
        process.env.RESUME_FULL_TOKEN = 'secret-value-123';
        expect(isValidResumeFullToken('secret-value-124')).toBe(false);
        expect(isValidResumeFullToken('short')).toBe(false);
    });

    it('is true only for an exact match', () => {
        process.env.RESUME_FULL_TOKEN = 'secret-value-123';
        expect(isValidResumeFullToken('secret-value-123')).toBe(true);
    });
});

describe('getResumeDownloadSignedUrl', () => {
    beforeEach(() => {
        createSignedUrlMock.mockReset();
        getAdminSupabaseMock.mockReturnValue({
            ok: true,
            client: {
                storage: {
                    from: () => ({ createSignedUrl: createSignedUrlMock }),
                },
            },
        });
    });

    it('returns a signed url with the 72h TTL on success', async () => {
        createSignedUrlMock.mockResolvedValue({
            data: { signedUrl: 'https://example.co/obj?token=abc' },
            error: null,
        });
        const result = await getResumeDownloadSignedUrl();
        expect(result).toEqual({
            ok: true,
            url: 'https://example.co/obj?token=abc',
            expiresInSeconds: RESUME_SIGNED_URL_TTL_SECONDS,
        });
    });

    it('reports unconfigured when the admin client is unavailable', async () => {
        getAdminSupabaseMock.mockReturnValue({
            ok: false,
            reason: 'unconfigured',
        });
        const result = await getResumeDownloadSignedUrl();
        expect(result).toEqual({ ok: false, reason: 'unconfigured' });
    });

    it('maps a missing object to not_found', async () => {
        createSignedUrlMock.mockResolvedValue({
            data: null,
            error: { message: 'Object not found' },
        });
        const result = await getResumeDownloadSignedUrl();
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('not_found');
    });

    it('maps other storage failures to error', async () => {
        createSignedUrlMock.mockResolvedValue({
            data: null,
            error: { message: 'storage exploded' },
        });
        const result = await getResumeDownloadSignedUrl();
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('error');
    });
});
