import 'server-only';

import type {
    Bet,
    BetAnalyticsResponse,
    BetLeg,
    BetMarket,
    BetMetrics,
    BetSource,
    BetStatus,
} from '@bryandebaun/mcp-client';
import { createApi } from '@/lib/mcp';
import { unwrapApiResponse } from '@/lib/api-response';
import { parseBetLegs } from '@/lib/bets';

/**
 * Public, read-only Bets service.
 *
 * Surfaces Bryan's intuition-vs-AI betting experiment on the public `/media`
 * page. It reads the MCP Bet endpoints with the **server-to-server gateway key**
 * (`createApi()` with no user token → sends `MCP_API_KEY`, which satisfies the
 * `@Security('api_key')` read endpoints) and maps every record through a strict
 * **allowlist** into money-free DTOs.
 *
 * SECURITY: this module is `server-only`. The gateway key and the raw money
 * fields (`stake`, `payout`, `notes`, `staked`, `profit`) must NEVER reach the
 * client. The mappers below copy field-by-field — they do **not** spread the
 * raw upstream object — so a new money field added upstream can never leak by
 * accident. The accompanying test asserts the DTOs do not carry those keys.
 */

/**
 * A single pick, with ZERO money fields. Field-by-field allowlist of {@link Bet}.
 *
 * Intentionally EXCLUDES `stake`, `payout`, `notes`, `book` and anything
 * money-derived. (`book` is the sportsbook name — harmless, but the public view
 * has no use for it and omitting it keeps the surface minimal.)
 */
export interface PublicBet {
    id: number;
    placedAt: string;
    sport: string;
    league: string | null;
    event: string;
    market: BetMarket;
    selection: string;
    line: number | null;
    oddsAmerican: number;
    status: BetStatus;
    source: BetSource;
    settledAt: string | null;
    closingOddsAmerican: number | null;
    aiModel: string | null;
    aiRationale: string | null;
    aiEstProb: number | null;
    aiEV: number | null;
    legs: PublicBetLeg[];
}

/** A parlay leg, money-free (legs never carry money fields). */
export interface PublicBetLeg {
    event: string;
    selection: string;
    oddsAmerican: number | null;
    line: number | null;
}

/**
 * Money-free metrics. Allowlist of {@link BetMetrics} that EXCLUDES `staked`
 * and `profit` (both dollars). `roi` (ratio), `units` (unit count) and
 * `avgClvPct` (%) are dimensionless and safe to expose.
 */
export interface PublicBetMetrics {
    count: number;
    pending: number;
    settled: number;
    wins: number;
    losses: number;
    pushes: number;
    voids: number;
    hitRate: number | null;
    roi: number | null;
    units: number | null;
    clvCount: number;
    avgClvPct: number | null;
}

export interface PublicBetAnalytics {
    overall: PublicBetMetrics;
    bySource: {
        INTUITION: PublicBetMetrics;
        AI_ASSISTED: PublicBetMetrics;
    };
}

/** Map a single upstream {@link Bet} to a money-free {@link PublicBet}. */
function toPublicBet(bet: Bet): PublicBet {
    const legs: PublicBetLeg[] = parseBetLegs(bet.legs).map(
        (leg: BetLeg) => ({
            event: leg.event,
            selection: leg.selection,
            oddsAmerican: leg.oddsAmerican ?? null,
            line: leg.line ?? null,
        }),
    );

    return {
        id: bet.id,
        placedAt: bet.placedAt,
        sport: bet.sport,
        league: bet.league ?? null,
        event: bet.event,
        market: bet.market,
        selection: bet.selection,
        line: bet.line ?? null,
        oddsAmerican: bet.oddsAmerican,
        status: bet.status,
        source: bet.source,
        settledAt: bet.settledAt ?? null,
        closingOddsAmerican: bet.closingOddsAmerican ?? null,
        aiModel: bet.aiModel ?? null,
        aiRationale: bet.aiRationale ?? null,
        aiEstProb: bet.aiEstProb ?? null,
        aiEV: bet.aiEV ?? null,
        legs,
    };
}

/** Map upstream {@link BetMetrics} to money-free {@link PublicBetMetrics}. */
function toPublicMetrics(m: BetMetrics): PublicBetMetrics {
    return {
        count: m.count,
        pending: m.pending,
        settled: m.settled,
        wins: m.wins,
        losses: m.losses,
        pushes: m.pushes,
        voids: m.voids,
        hitRate: m.hitRate,
        roi: m.roi,
        units: m.units,
        clvCount: m.clvCount,
        avgClvPct: m.avgClvPct,
    };
}

function toPublicAnalytics(
    res: BetAnalyticsResponse,
): PublicBetAnalytics {
    return {
        overall: toPublicMetrics(res.overall),
        bySource: {
            INTUITION: toPublicMetrics(res.bySource.INTUITION),
            AI_ASSISTED: toPublicMetrics(res.bySource.AI_ASSISTED),
        },
    };
}

/** Whether the MCP client is configured at all (env present). */
function mcpConfigured(): boolean {
    return Boolean(process.env.MCP_API_KEY || process.env.MCP_BASE_URL);
}

/**
 * Fetch all bets and return them as money-free {@link PublicBet}s. Fails
 * gracefully (empty list) when the API is unreachable or unconfigured, mirroring
 * the books service, so the public page always renders.
 */
export async function listPublicBets(): Promise<PublicBet[]> {
    if (!mcpConfigured()) return [];
    try {
        const api = createApi();
        const res = await api.api.listBets();
        const payload = unwrapApiResponse<{ bets?: Bet[] }>(res);
        const bets = payload?.bets ?? [];
        return bets.map(toPublicBet);
    } catch (e) {
        console.error('listPublicBets failed; returning empty list', e);
        return [];
    }
}

/**
 * Fetch the intuition-vs-AI scoreboard as money-free analytics. Returns `null`
 * on failure so the UI can show an empty state.
 */
export async function getPublicBetAnalytics(): Promise<PublicBetAnalytics | null> {
    if (!mcpConfigured()) return null;
    try {
        const api = createApi();
        const res = await api.api.getAnalytics();
        const payload = unwrapApiResponse<BetAnalyticsResponse>(res);
        if (!payload?.overall || !payload?.bySource) return null;
        return toPublicAnalytics(payload);
    } catch (e) {
        console.error('getPublicBetAnalytics failed; returning null', e);
        return null;
    }
}
