import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/supabase/admin', () => ({
    getAdminSupabase: vi.fn(),
}));

import { requireAdmin } from '@/lib/auth-guard';
import { getAdminSupabase } from '@/lib/supabase/admin';

const requireAdminMock = requireAdmin as ReturnType<typeof vi.fn>;
const getAdminSupabaseMock = getAdminSupabase as ReturnType<typeof vi.fn>;

const forbidden = new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
});

/** Build a mocked service-role storage client and expose its spies. */
function mockStorage(
    uploadResult:
        | { error: { message: string } | null }
        | Array<{ error: { message: string } | null }> = { error: null },
) {
    const results = Array.isArray(uploadResult)
        ? [...uploadResult]
        : [uploadResult];
    // Each call consumes the next queued result; the last result repeats so a
    // single-arg caller behaves exactly as before.
    const upload = vi.fn().mockImplementation(() => {
        const next = results.length > 1 ? results.shift() : results[0];
        return Promise.resolve(next ?? { error: null });
    });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrl = vi.fn().mockImplementation((key: string) => ({
        data: {
            publicUrl: `https://storage.example.com/article-assets/${key}`,
        },
    }));
    const from = vi.fn().mockReturnValue({ upload, remove, getPublicUrl });
    getAdminSupabaseMock.mockReturnValue({
        ok: true,
        client: { storage: { from } },
    });
    return { upload, remove, getPublicUrl, from };
}

/** Build a NextRequest whose formData() yields the given file (or nothing). */
function reqWithFile(file: File | null) {
    const formData = new FormData();
    if (file) formData.set('file', file);
    return {
        formData: vi.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;
}

/** Build a NextRequest carrying a light `file` plus a `dark` file (pair mode). */
function reqWithPair(light: File, dark: File | null) {
    const formData = new FormData();
    formData.set('file', light);
    if (dark) formData.set('dark', dark);
    return {
        formData: vi.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;
}

describe('POST /api/admin/upload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requireAdminMock.mockResolvedValue(null);
    });

    it('returns the guard response and never touches storage when not admin', async () => {
        requireAdminMock.mockResolvedValueOnce(forbidden);
        const { POST } = await import('../route');
        const res = await POST(reqWithFile(null));
        expect((res as Response).status).toBe(403);
        // Storage client must not even be requested.
        expect(getAdminSupabaseMock).not.toHaveBeenCalled();
    });

    it('returns 503 when the service-role client is unconfigured', async () => {
        getAdminSupabaseMock.mockReturnValue({
            ok: false,
            reason: 'unconfigured',
        });
        const { POST } = await import('../route');
        const file = new File(['x'], 'a.png', { type: 'image/png' });
        const res = await POST(reqWithFile(file));
        expect((res as Response).status).toBe(503);
    });

    it('returns 400 when no file is provided', async () => {
        mockStorage();
        const { POST } = await import('../route');
        const res = await POST(reqWithFile(null));
        expect((res as Response).status).toBe(400);
    });

    it('returns 400 for a disallowed MIME type', async () => {
        const { upload } = mockStorage();
        const { POST } = await import('../route');
        const file = new File(['x'], 'evil.exe', {
            type: 'application/octet-stream',
        });
        const res = await POST(reqWithFile(file));
        expect((res as Response).status).toBe(400);
        expect(upload).not.toHaveBeenCalled();
    });

    it('returns 400 when the file exceeds 5 MB', async () => {
        const { upload } = mockStorage();
        const { POST } = await import('../route');
        const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', {
            type: 'image/png',
        });
        const res = await POST(reqWithFile(big));
        expect((res as Response).status).toBe(400);
        expect(upload).not.toHaveBeenCalled();
    });

    it('uploads with a server-derived key and returns 200 with the url', async () => {
        const { upload, from } = mockStorage();
        const { POST } = await import('../route');
        const file = new File(['x'], '../../etc/passwd.jpeg', {
            type: 'image/jpeg',
        });
        const res = await POST(reqWithFile(file));
        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.url).toMatch(
            /^https:\/\/storage\.example\.com\/article-assets\/\d{4}\/[0-9a-f-]{36}\.jpg$/,
        );
        // Single mode never advertises a dark sibling.
        expect(json.darkUrl).toBeUndefined();
        expect(json.themed).toBeUndefined();

        expect(from).toHaveBeenCalledWith('article-assets');
        expect(upload).toHaveBeenCalledTimes(1);
        const key = upload.mock.calls[0][0] as string;
        // Extension comes from the validated MIME (jpeg -> jpg), not the name.
        expect(key).toMatch(/^\d{4}\/[0-9a-f-]{36}\.jpg$/);
        // The key must never carry the original filename or traversal.
        expect(key).not.toContain('passwd');
        expect(key).not.toContain('..');
        expect(key.startsWith('/')).toBe(false);
        // upsert disabled so an existing object is never overwritten.
        expect(upload.mock.calls[0][2]).toMatchObject({ upsert: false });
    });

    it('returns 502 with a clear message when the bucket is missing', async () => {
        mockStorage({ error: { message: 'Bucket not found' } });
        const { POST } = await import('../route');
        const file = new File(['x'], 'a.png', { type: 'image/png' });
        const res = await POST(reqWithFile(file));
        expect((res as Response).status).toBe(502);
        const json = await (res as Response).json();
        expect(json.error).toMatch(/article-assets/);
    });

    it('stores a themed pair under one uuid base and returns darkUrl + themed', async () => {
        const { upload, remove } = mockStorage();
        const { POST } = await import('../route');
        const light = new File(['l'], 'foo.svg', { type: 'image/svg+xml' });
        const dark = new File(['d'], 'foo_dark.svg', { type: 'image/svg+xml' });
        const res = await POST(reqWithPair(light, dark));

        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.themed).toBe(true);
        expect(json.url).toMatch(/\d{4}\/[0-9a-f-]{36}\.svg$/);
        expect(json.darkUrl).toMatch(/\d{4}\/[0-9a-f-]{36}_dark\.svg$/);

        expect(upload).toHaveBeenCalledTimes(2);
        const lightKey = upload.mock.calls[0][0] as string;
        const darkKey = upload.mock.calls[1][0] as string;
        expect(lightKey).toMatch(/^\d{4}\/[0-9a-f-]{36}\.svg$/);
        expect(darkKey).toMatch(/^\d{4}\/[0-9a-f-]{36}_dark\.svg$/);
        // Same uuid base, dark key = light key with `_dark` before the ext.
        expect(darkKey).toBe(lightKey.replace(/\.svg$/, '_dark.svg'));
        expect(json.path).toBe(lightKey);
        // Both uploaded → nothing to clean up.
        expect(remove).not.toHaveBeenCalled();
    });

    it('rejects a pair whose light/dark MIME types differ (400, no upload)', async () => {
        const { upload } = mockStorage();
        const { POST } = await import('../route');
        const light = new File(['l'], 'foo.svg', { type: 'image/svg+xml' });
        const dark = new File(['d'], 'foo_dark.png', { type: 'image/png' });
        const res = await POST(reqWithPair(light, dark));
        expect((res as Response).status).toBe(400);
        expect(upload).not.toHaveBeenCalled();
    });

    it('enforces size/type limits on the dark file too (400, no upload)', async () => {
        const { upload } = mockStorage();
        const { POST } = await import('../route');
        const light = new File(['l'], 'foo.svg', { type: 'image/svg+xml' });
        const bigDark = new File(
            [new Uint8Array(5 * 1024 * 1024 + 1)],
            'foo_dark.svg',
            { type: 'image/svg+xml' },
        );
        const res = await POST(reqWithPair(light, bigDark));
        expect((res as Response).status).toBe(400);
        expect(upload).not.toHaveBeenCalled();
    });

    it('removes the orphaned light object when the dark upload fails (502)', async () => {
        const { upload, remove } = mockStorage([
            { error: null },
            { error: { message: 'network blip' } },
        ]);
        const { POST } = await import('../route');
        const light = new File(['l'], 'foo.svg', { type: 'image/svg+xml' });
        const dark = new File(['d'], 'foo_dark.svg', { type: 'image/svg+xml' });
        const res = await POST(reqWithPair(light, dark));

        expect((res as Response).status).toBe(502);
        expect(upload).toHaveBeenCalledTimes(2);
        const lightKey = upload.mock.calls[0][0] as string;
        // Best-effort cleanup of the half-pair.
        expect(remove).toHaveBeenCalledWith([lightKey]);
    });

    it('does not touch storage for a pair request when not admin', async () => {
        requireAdminMock.mockResolvedValueOnce(forbidden);
        const { POST } = await import('../route');
        const light = new File(['l'], 'foo.svg', { type: 'image/svg+xml' });
        const dark = new File(['d'], 'foo_dark.svg', { type: 'image/svg+xml' });
        const res = await POST(reqWithPair(light, dark));
        expect((res as Response).status).toBe(403);
        expect(getAdminSupabaseMock).not.toHaveBeenCalled();
    });
});
