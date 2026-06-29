import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
    revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const SECRET = 'test-secret';

function makeReq(
    body: unknown,
    {
        headers = {},
        query = '',
    }: { headers?: Record<string, string>; query?: string } = {},
) {
    return new NextRequest(`http://localhost/api/revalidate${query}`, {
        method: 'POST',
        body: typeof body === 'string' ? body : JSON.stringify(body),
        headers: { 'content-type': 'application/json', ...headers },
    });
}

describe('POST /api/revalidate', () => {
    beforeEach(() => {
        revalidatePath.mockReset();
    });

    afterEach(() => {
        delete process.env.REVALIDATE_SECRET;
        vi.resetModules();
    });

    it('returns 503 when REVALIDATE_SECRET is not configured', async () => {
        delete process.env.REVALIDATE_SECRET;
        const { POST } = await import('../route');
        const res = await POST(makeReq({}));
        expect(res.status).toBe(503);
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('returns 401 when no secret is provided', async () => {
        process.env.REVALIDATE_SECRET = SECRET;
        const { POST } = await import('../route');
        const res = await POST(makeReq({}));
        expect(res.status).toBe(401);
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('returns 401 when the secret does not match', async () => {
        process.env.REVALIDATE_SECRET = SECRET;
        const { POST } = await import('../route');
        const res = await POST(
            makeReq({}, { headers: { 'x-revalidate-secret': 'wrong' } }),
        );
        expect(res.status).toBe(401);
        expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('revalidates the list with a valid header secret (no slug)', async () => {
        process.env.REVALIDATE_SECRET = SECRET;
        const { POST } = await import('../route');
        const res = await POST(
            makeReq({}, { headers: { 'x-revalidate-secret': SECRET } }),
        );
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({ revalidated: true });
        expect(revalidatePath).toHaveBeenCalledWith('/philosophy');
        expect(revalidatePath).toHaveBeenCalledTimes(1);
    });

    it('revalidates the list and the detail page when a slug is provided', async () => {
        process.env.REVALIDATE_SECRET = SECRET;
        const { POST } = await import('../route');
        const res = await POST(
            makeReq(
                { slug: 'cptsd' },
                { headers: { 'x-revalidate-secret': SECRET } },
            ),
        );
        expect(res.status).toBe(200);
        expect(revalidatePath).toHaveBeenCalledWith('/philosophy');
        expect(revalidatePath).toHaveBeenCalledWith('/philosophy/cptsd');
    });

    it('accepts the secret via the ?secret= query param', async () => {
        process.env.REVALIDATE_SECRET = SECRET;
        const { POST } = await import('../route');
        const res = await POST(makeReq({}, { query: `?secret=${SECRET}` }));
        expect(res.status).toBe(200);
        expect(revalidatePath).toHaveBeenCalledWith('/philosophy');
    });
});
