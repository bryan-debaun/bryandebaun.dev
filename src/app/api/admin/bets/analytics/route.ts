import { NextResponse, type NextRequest } from 'next/server';
import {
    type BetAnalyticsResponse,
    BetMarket,
    BetSource,
} from '@bryandebaun/mcp-client';
import { requireAdmin } from '@/lib/auth-guard';
import { unwrapApiResponse } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';

import { createApi as _createApi } from '@/lib/mcp';
export function createApi(token?: string) {
    return _createApi(token);
}

function mcpConfigured(): boolean {
    return Boolean(process.env.MCP_API_KEY || process.env.MCP_BASE_URL);
}

function asEnum<T extends Record<string, string>>(
    enumObj: T,
    value: string | null,
): T[keyof T] | undefined {
    if (!value) return undefined;
    const values = Object.values(enumObj) as string[];
    return values.includes(value) ? (value as T[keyof T]) : undefined;
}

/**
 * GET /api/admin/bets/analytics
 *
 * Returns the intuition-vs-AI scoreboard ({@link BetAnalyticsResponse}) from the
 * MCP `getAnalytics` endpoint, forwarding the filters it supports (source,
 * sport, market, from, to — note: no `status`). Admin-gated; 503 when the MCP
 * client is unconfigured.
 */
export async function GET(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard) return guard;

    if (!mcpConfigured()) {
        return NextResponse.json(
            { error: 'Bet tracking is not configured.' },
            { status: 503 },
        );
    }

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const api = createApi(session?.access_token);

    const sp = new URL(req.url).searchParams;
    const sport = sp.get('sport');
    const from = sp.get('from');
    const to = sp.get('to');

    const query = {
        source: asEnum(BetSource, sp.get('source')),
        sport: sport ?? undefined,
        market: asEnum(BetMarket, sp.get('market')),
        from: from ?? undefined,
        to: to ?? undefined,
    };

    try {
        const res = await api.api.getAnalytics(query);
        const payload = unwrapApiResponse<BetAnalyticsResponse>(res);
        return NextResponse.json(payload);
    } catch (e) {
        console.error('Admin: failed to load bet analytics', e);
        return NextResponse.json(
            { error: 'Failed to load bet analytics' },
            { status: 502 },
        );
    }
}
