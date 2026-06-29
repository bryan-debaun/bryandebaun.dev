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
    uploadResult: { error: { message: string } | null } = { error: null },
) {
    const upload = vi.fn().mockResolvedValue(uploadResult);
    const getPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/article-assets/key' },
    });
    const from = vi.fn().mockReturnValue({ upload, getPublicUrl });
    getAdminSupabaseMock.mockReturnValue({
        ok: true,
        client: { storage: { from } },
    });
    return { upload, getPublicUrl, from };
}

/** Build a NextRequest whose formData() yields the given file (or nothing). */
function reqWithFile(file: File | null) {
    const formData = new FormData();
    if (file) formData.set('file', file);
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
        expect(json.url).toBe('https://storage.example.com/article-assets/key');

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
});
