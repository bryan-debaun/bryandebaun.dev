import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mutable handles for the token verifier, signed-URL minter, and the
// download-recording service call.
const verifyResumeDownloadLink = vi.fn();
const getResumeDownloadSignedUrl = vi.fn();
const recordResumeDownload = vi.fn();

vi.mock('@/lib/resume-download', () => ({
    verifyResumeDownloadLink: (...a: unknown[]) =>
        verifyResumeDownloadLink(...a),
    getResumeDownloadSignedUrl: (...a: unknown[]) =>
        getResumeDownloadSignedUrl(...a),
}));

vi.mock('@/lib/services/resume-requests', () => ({
    recordResumeDownload: (...a: unknown[]) => recordResumeDownload(...a),
}));

function makeReq(token?: string): NextRequest {
    const base = 'http://localhost/api/resume/download';
    const url =
        token === undefined ? base : `${base}?t=${encodeURIComponent(token)}`;
    return new NextRequest(url);
}

describe('GET /api/resume/download', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        verifyResumeDownloadLink.mockReturnValue({
            ok: true,
            requestId: 'req-1',
        });
        getResumeDownloadSignedUrl.mockResolvedValue({
            ok: true,
            url: 'https://storage.example/signed?token=abc',
            expiresInSeconds: 259200,
        });
        recordResumeDownload.mockResolvedValue({
            ok: true,
            request: { id: 'req-1', downloadCount: 1 },
        });
    });

    it('404s on an invalid/missing token and never touches storage or the count', async () => {
        verifyResumeDownloadLink.mockReturnValue({ ok: false });
        const { GET } = await import('../route');
        const res = await GET(makeReq('bad'));
        expect(res.status).toBe(404);
        expect(getResumeDownloadSignedUrl).not.toHaveBeenCalled();
        expect(recordResumeDownload).not.toHaveBeenCalled();
    });

    it('404s (and does NOT record) when the PDF object is missing', async () => {
        getResumeDownloadSignedUrl.mockResolvedValue({
            ok: false,
            reason: 'not_found',
        });
        const { GET } = await import('../route');
        const res = await GET(makeReq('good'));
        expect(res.status).toBe(404);
        expect(recordResumeDownload).not.toHaveBeenCalled();
    });

    it('503s (and does NOT record) on a transient storage error', async () => {
        getResumeDownloadSignedUrl.mockResolvedValue({
            ok: false,
            reason: 'error',
        });
        const { GET } = await import('../route');
        const res = await GET(makeReq('good'));
        expect(res.status).toBe(503);
        expect(recordResumeDownload).not.toHaveBeenCalled();
    });

    it('410s when the cap/expiry is reached (backend denies the record)', async () => {
        recordResumeDownload.mockResolvedValue({ ok: false, reason: 'denied' });
        const { GET } = await import('../route');
        const res = await GET(makeReq('good'));
        expect(res.status).toBe(410);
        const json = await res.json();
        expect(json.error).toMatch(/limit|expired/i);
    });

    it('503s when recording fails transiently (never serves unrecorded)', async () => {
        recordResumeDownload.mockResolvedValue({ ok: false, reason: 'error' });
        const { GET } = await import('../route');
        const res = await GET(makeReq('good'));
        expect(res.status).toBe(503);
    });

    it('302-redirects to the signed URL once the download is recorded', async () => {
        const { GET } = await import('../route');
        const res = await GET(makeReq('good'));
        expect(res.status).toBe(302);
        expect(res.headers.get('location')).toBe(
            'https://storage.example/signed?token=abc',
        );
        expect(recordResumeDownload).toHaveBeenCalledWith('req-1');
    });
});
