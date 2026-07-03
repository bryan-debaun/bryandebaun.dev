import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'mock-jwt-token' } },
                error: null,
            }),
        },
    }),
}));

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
    revalidatePath: (path: string) => revalidatePath(path),
}));

const getFullResume = vi.fn();
const updateResume = vi.fn();
vi.mock('@/lib/services/resume', () => ({
    getFullResume: () => getFullResume(),
    updateResume: (token: string | undefined, doc: unknown) =>
        updateResume(token, doc),
}));

import { requireAdmin } from '@/lib/auth-guard';

const RESUME = {
    basics: {
        name: 'Bryan DeBaun',
        label: 'Senior Software Engineer',
        url: 'https://bryandebaun.dev',
        summary: 'Summary.',
        profiles: [],
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
};

const unauthorizedResponse = new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 },
);
const forbiddenResponse = new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
});

beforeEach(() => {
    vi.clearAllMocks();
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    getFullResume.mockResolvedValue(RESUME);
    updateResume.mockResolvedValue(RESUME);
});

function putReq(body: unknown): NextRequest {
    return new Request('http://localhost/api/admin/resume', {
        method: 'PUT',
        body: JSON.stringify(body),
    }) as unknown as NextRequest;
}

describe('GET /api/admin/resume', () => {
    it('returns the full résumé for an admin', async () => {
        const route = await import('../route');
        const res = await route.GET();
        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.resume.basics.name).toBe('Bryan DeBaun');
    });

    it('returns 401 when not authenticated', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            unauthorizedResponse,
        );
        const route = await import('../route');
        const res = await route.GET();
        expect((res as Response).status).toBe(401);
    });

    it('returns 502 when the service cannot load', async () => {
        getFullResume.mockResolvedValueOnce(null);
        const route = await import('../route');
        const res = await route.GET();
        expect((res as Response).status).toBe(502);
    });
});

describe('PUT /api/admin/resume', () => {
    it('updates and revalidates the résumé paths', async () => {
        const route = await import('../route');
        const res = await route.PUT(putReq(RESUME));
        expect((res as Response).status).toBe(200);
        expect(updateResume).toHaveBeenCalledWith('mock-jwt-token', RESUME);
        expect(revalidatePath).toHaveBeenCalledWith('/resume');
        expect(revalidatePath).toHaveBeenCalledWith('/resume/full');
    });

    it('rejects a missing basics.name with a 400 field error', async () => {
        const route = await import('../route');
        const res = await route.PUT(
            putReq({ ...RESUME, basics: { ...RESUME.basics, name: '' } }),
        );
        expect((res as Response).status).toBe(400);
        const json = await (res as Response).json();
        expect(json.fieldErrors['basics.name']).toBeTruthy();
        expect(updateResume).not.toHaveBeenCalled();
    });

    it('rejects a non-array collection field with a 400', async () => {
        const route = await import('../route');
        const res = await route.PUT(
            putReq({ ...RESUME, work: 'not-an-array' }),
        );
        expect((res as Response).status).toBe(400);
        const json = await (res as Response).json();
        expect(json.fieldErrors.work).toBeTruthy();
    });

    it('maps a backend failure to 502', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        updateResume.mockRejectedValueOnce(new Error('backend down'));
        const route = await import('../route');
        const res = await route.PUT(putReq(RESUME));
        expect((res as Response).status).toBe(502);
    });

    it('returns 401 when not authenticated', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            unauthorizedResponse,
        );
        const route = await import('../route');
        const res = await route.PUT(putReq(RESUME));
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            forbiddenResponse,
        );
        const route = await import('../route');
        const res = await route.PUT(putReq(RESUME));
        expect((res as Response).status).toBe(403);
    });
});
