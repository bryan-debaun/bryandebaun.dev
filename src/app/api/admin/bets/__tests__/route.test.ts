import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Default: admin allowed. Individual tests override with mockResolvedValueOnce.
vi.mock('@/lib/auth-guard', () => ({
    requireAdmin: vi.fn().mockResolvedValue(null),
}));

// Mock Supabase server client so getSession() works without the Next request store.
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

import { requireAdmin } from '@/lib/auth-guard';

const listBets = vi.fn();
const createBet = vi.fn();
const getAnalytics = vi.fn();
const settleBet = vi.fn();
const updateBet = vi.fn();
const deleteBet = vi.fn();

vi.mock('@bryandebaun/mcp-client', async (importOriginal) => {
    const original = (await importOriginal()) as Record<string, unknown>;
    return {
        ...original,
        Api: class {
            setSecurityData = vi.fn();
            api = {
                listBets,
                createBet,
                getAnalytics,
                settleBet,
                updateBet,
                deleteBet,
            };
        },
    };
});

const requireAdminMock = requireAdmin as ReturnType<typeof vi.fn>;

const unauthorized = new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
});
const forbidden = new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
});

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue(null);
    // Ensure the MCP "configured" guard passes by default.
    process.env.MCP_API_KEY = 'test-key';
});

afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
});

describe('GET /api/admin/bets', () => {
    it('returns 401 when unauthenticated', async () => {
        requireAdminMock.mockResolvedValueOnce(unauthorized);
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/bets');
        const res = await route.GET(req as unknown as NextRequest);
        expect((res as Response).status).toBe(401);
    });

    it('returns 403 when not admin', async () => {
        requireAdminMock.mockResolvedValueOnce(forbidden);
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/bets');
        const res = await route.GET(req as unknown as NextRequest);
        expect((res as Response).status).toBe(403);
    });

    it('returns 503 when MCP is unconfigured', async () => {
        delete process.env.MCP_API_KEY;
        delete process.env.MCP_BASE_URL;
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/bets');
        const res = await route.GET(req as unknown as NextRequest);
        expect((res as Response).status).toBe(503);
    });

    it('lists bets and forwards supported filters', async () => {
        listBets.mockResolvedValue({
            data: { bets: [{ id: 1, event: 'A' }], total: 1 },
        });
        const route = await import('../route');
        const req = new Request(
            'http://localhost/api/admin/bets?source=AI_ASSISTED&status=PENDING&sport=NFL&market=spread&limit=10',
        );
        const res = await route.GET(req as unknown as NextRequest);
        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.bets).toHaveLength(1);
        expect(listBets).toHaveBeenCalledWith({
            source: 'AI_ASSISTED',
            status: 'PENDING',
            sport: 'NFL',
            market: 'spread',
            limit: 10,
            offset: undefined,
        });
    });

    it('drops unknown enum filter values', async () => {
        listBets.mockResolvedValue({ data: { bets: [], total: 0 } });
        const route = await import('../route');
        const req = new Request(
            'http://localhost/api/admin/bets?source=BOGUS&status=NOPE',
        );
        await route.GET(req as unknown as NextRequest);
        expect(listBets).toHaveBeenCalledWith(
            expect.objectContaining({
                source: undefined,
                status: undefined,
            }),
        );
    });

    it('returns 502 when the upstream call throws', async () => {
        listBets.mockRejectedValue(new Error('boom'));
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/bets');
        const res = await route.GET(req as unknown as NextRequest);
        expect((res as Response).status).toBe(502);
    });
});

describe('POST /api/admin/bets', () => {
    it('creates a bet and returns 201', async () => {
        createBet.mockResolvedValue({ data: { id: 2, event: 'New' } });
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/bets', {
            method: 'POST',
            body: JSON.stringify({
                sport: 'NFL',
                event: 'New',
                market: 'moneyline',
                selection: 'Team A',
                oddsAmerican: -110,
                stake: 50,
                source: 'INTUITION',
            }),
        });
        const res = await route.POST(req as unknown as NextRequest);
        expect((res as Response).status).toBe(201);
        const json = await (res as Response).json();
        expect(json.id).toBe(2);
        expect(createBet).toHaveBeenCalledTimes(1);
    });

    it('returns 401 when unauthenticated', async () => {
        requireAdminMock.mockResolvedValueOnce(unauthorized);
        const route = await import('../route');
        const req = new Request('http://localhost/api/admin/bets', {
            method: 'POST',
            body: JSON.stringify({}),
        });
        const res = await route.POST(req as unknown as NextRequest);
        expect((res as Response).status).toBe(401);
    });
});

describe('GET /api/admin/bets/analytics', () => {
    const analytics = {
        overall: { count: 3 },
        bySource: {
            AI_ASSISTED: { count: 1, avgClvPct: 2.5 },
            INTUITION: { count: 2, avgClvPct: -1.0 },
        },
    };

    it('returns the analytics shape and forwards filters', async () => {
        getAnalytics.mockResolvedValue({ data: analytics });
        const route = await import('../analytics/route');
        const req = new Request(
            'http://localhost/api/admin/bets/analytics?sport=NFL&from=2026-01-01&to=2026-06-01',
        );
        const res = await route.GET(req as unknown as NextRequest);
        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.bySource.AI_ASSISTED.count).toBe(1);
        expect(json.bySource.INTUITION.count).toBe(2);
        expect(getAnalytics).toHaveBeenCalledWith(
            expect.objectContaining({
                sport: 'NFL',
                from: '2026-01-01',
                to: '2026-06-01',
            }),
        );
    });

    it('returns 403 for non-admin', async () => {
        requireAdminMock.mockResolvedValueOnce(forbidden);
        const route = await import('../analytics/route');
        const req = new Request('http://localhost/api/admin/bets/analytics');
        const res = await route.GET(req as unknown as NextRequest);
        expect((res as Response).status).toBe(403);
    });

    it('returns 503 when MCP unconfigured', async () => {
        delete process.env.MCP_API_KEY;
        delete process.env.MCP_BASE_URL;
        const route = await import('../analytics/route');
        const req = new Request('http://localhost/api/admin/bets/analytics');
        const res = await route.GET(req as unknown as NextRequest);
        expect((res as Response).status).toBe(503);
    });
});

describe('POST /api/admin/bets/[id]/settle', () => {
    it('settles a bet and returns it', async () => {
        settleBet.mockResolvedValue({
            data: { id: 1, status: 'WON', payout: 95 },
        });
        const route = await import('../[id]/settle/route');
        const req = new Request('http://localhost/api/admin/bets/1/settle', {
            method: 'POST',
            body: JSON.stringify({ status: 'WON' }),
        });
        const res = await route.POST(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(200);
        const json = await (res as Response).json();
        expect(json.status).toBe('WON');
        expect(settleBet).toHaveBeenCalledWith(1, { status: 'WON' });
    });

    it('returns 401 when unauthenticated', async () => {
        requireAdminMock.mockResolvedValueOnce(unauthorized);
        const route = await import('../[id]/settle/route');
        const req = new Request('http://localhost/api/admin/bets/1/settle', {
            method: 'POST',
            body: JSON.stringify({ status: 'WON' }),
        });
        const res = await route.POST(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(401);
    });
});

describe('PUT/DELETE /api/admin/bets/[id]', () => {
    it('updates a bet', async () => {
        updateBet.mockResolvedValue({ data: { id: 1, sport: 'NBA' } });
        const route = await import('../[id]/route');
        const req = new Request('http://localhost/api/admin/bets/1', {
            method: 'PUT',
            body: JSON.stringify({ sport: 'NBA' }),
        });
        const res = await route.PUT(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(200);
        expect(updateBet).toHaveBeenCalledWith(1, { sport: 'NBA' });
    });

    it('deletes a bet and returns 204', async () => {
        deleteBet.mockResolvedValue({ data: { success: true } });
        const route = await import('../[id]/route');
        const req = new Request('http://localhost/api/admin/bets/1', {
            method: 'DELETE',
        });
        const res = await route.DELETE(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(204);
        expect(deleteBet).toHaveBeenCalledWith(1);
    });

    it('returns 403 for non-admin on delete', async () => {
        requireAdminMock.mockResolvedValueOnce(forbidden);
        const route = await import('../[id]/route');
        const req = new Request('http://localhost/api/admin/bets/1', {
            method: 'DELETE',
        });
        const res = await route.DELETE(req as unknown as NextRequest, {
            params: { id: '1' },
        });
        expect((res as Response).status).toBe(403);
    });
});
