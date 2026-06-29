import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `public-bets.ts` is `server-only`; that marker package throws under the
// default (node) condition vitest resolves. Stub it to a no-op so the module
// can be imported in tests.
vi.mock('server-only', () => ({}));

const listBets = vi.fn();
const getAnalytics = vi.fn();

vi.mock('@/lib/mcp', () => ({
    createApi: () => ({ api: { listBets, getAnalytics } }),
}));

// Keep the real Bet enums so status/source/market comparisons behave as in prod.
vi.mock('@bryandebaun/mcp-client', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@bryandebaun/mcp-client')>();
    return actual;
});

import {
    getPublicBetAnalytics,
    listPublicBets,
} from '@/lib/services/public-bets';

/** A raw upstream bet carrying every money field we must strip. */
const rawBet = {
    id: 7,
    placedAt: '2026-06-01T12:00:00.000Z',
    sport: 'Soccer',
    league: 'EPL',
    event: 'Arsenal vs. Chelsea',
    market: 'moneyline',
    selection: 'Arsenal',
    line: null,
    oddsAmerican: -120,
    stake: 50, // money — must NOT leak
    book: 'DraftKings',
    status: 'WON',
    settledAt: '2026-06-02T12:00:00.000Z',
    payout: 91.67, // money — must NOT leak
    source: 'AI_ASSISTED',
    aiModel: 'gpt-x',
    aiRationale: 'Edge on home form.',
    aiEstProb: 0.6,
    aiEV: 0.08,
    closingLine: null,
    closingOddsAmerican: -135,
    legs: [
        {
            event: 'Arsenal vs. Chelsea',
            selection: 'Arsenal',
            oddsAmerican: -120,
            line: 0,
        },
    ],
    notes: 'private note', // must NOT leak
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-02T12:00:00.000Z',
};

/** A raw metrics block carrying the money fields (`staked`, `profit`). */
const rawMetrics = {
    count: 3,
    pending: 1,
    settled: 2,
    wins: 1,
    losses: 1,
    pushes: 0,
    voids: 0,
    hitRate: 0.5,
    staked: 150, // money — must NOT leak
    profit: -10, // money — must NOT leak
    roi: -0.066,
    units: -0.2,
    clvCount: 2,
    avgClvPct: 1.4,
};

const rawAnalytics = {
    overall: rawMetrics,
    bySource: {
        INTUITION: rawMetrics,
        AI_ASSISTED: rawMetrics,
    },
};

const MONEY_BET_KEYS = ['stake', 'payout', 'notes', 'book'];
const MONEY_METRIC_KEYS = ['staked', 'profit'];

beforeEach(() => {
    // The service short-circuits to empty/null unless the MCP env is present
    // (`mcpConfigured()`). Stub it so these tests are environment-independent —
    // CI has no MCP_* vars, which otherwise masks the mocked happy path.
    vi.stubEnv('MCP_API_KEY', 'test-key');
    vi.stubEnv('MCP_BASE_URL', 'https://mcp.test');
    listBets.mockReset();
    getAnalytics.mockReset();
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('listPublicBets — money sanitization (security guard)', () => {
    it('maps to the public allowlist and strips every money field', async () => {
        listBets.mockResolvedValue({ data: { bets: [rawBet], total: 1 } });

        const result = await listPublicBets();
        expect(result).toHaveLength(1);
        const bet = result[0];

        // Allowed fields survive.
        expect(bet.id).toBe(7);
        expect(bet.event).toBe('Arsenal vs. Chelsea');
        expect(bet.oddsAmerican).toBe(-120);
        expect(bet.closingOddsAmerican).toBe(-135);
        expect(bet.aiModel).toBe('gpt-x');
        expect(bet.aiRationale).toBe('Edge on home form.');

        // Money fields are gone — explicit per-key regression assertions.
        expect(bet).not.toHaveProperty('stake');
        expect(bet).not.toHaveProperty('payout');
        expect(bet).not.toHaveProperty('notes');
        for (const key of MONEY_BET_KEYS) {
            expect(Object.keys(bet)).not.toContain(key);
        }
        // Belt-and-suspenders: no field name even hints at money.
        for (const key of Object.keys(bet)) {
            expect(key).not.toMatch(/stake|payout|profit|amount|notes/i);
        }
    });

    it('strips money fields from parlay legs too', async () => {
        listBets.mockResolvedValue({ data: { bets: [rawBet], total: 1 } });
        const [bet] = await listPublicBets();
        expect(bet.legs).toHaveLength(1);
        const leg = bet.legs[0];
        expect(leg).toEqual({
            event: 'Arsenal vs. Chelsea',
            selection: 'Arsenal',
            oddsAmerican: -120,
            line: 0,
        });
        expect(leg).not.toHaveProperty('stake');
        expect(leg).not.toHaveProperty('payout');
    });

    it('returns an empty list when the API throws (graceful failure)', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        listBets.mockRejectedValue(new Error('network down'));
        await expect(listPublicBets()).resolves.toEqual([]);
    });

    it('returns an empty list when the payload has no bets', async () => {
        listBets.mockResolvedValue({ data: {} });
        await expect(listPublicBets()).resolves.toEqual([]);
    });
});

describe('getPublicBetAnalytics — money sanitization (security guard)', () => {
    it('maps metrics to the allowlist and strips staked/profit', async () => {
        getAnalytics.mockResolvedValue({ data: rawAnalytics });

        const result = await getPublicBetAnalytics();
        expect(result).not.toBeNull();
        const blocks = [
            result?.overall,
            result?.bySource.INTUITION,
            result?.bySource.AI_ASSISTED,
        ];

        for (const m of blocks) {
            expect(m).toBeDefined();
            if (!m) continue;
            // Allowed dimensionless metrics survive.
            expect(m.roi).toBe(-0.066);
            expect(m.units).toBe(-0.2);
            expect(m.avgClvPct).toBe(1.4);
            expect(m.hitRate).toBe(0.5);

            // Dollar fields are gone.
            expect(m).not.toHaveProperty('staked');
            expect(m).not.toHaveProperty('profit');
            for (const key of MONEY_METRIC_KEYS) {
                expect(Object.keys(m)).not.toContain(key);
            }
        }
    });

    it('returns null when the API throws (graceful failure)', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        getAnalytics.mockRejectedValue(new Error('boom'));
        await expect(getPublicBetAnalytics()).resolves.toBeNull();
    });

    it('returns null when the payload is malformed', async () => {
        getAnalytics.mockResolvedValue({ data: {} });
        await expect(getPublicBetAnalytics()).resolves.toBeNull();
    });
});
