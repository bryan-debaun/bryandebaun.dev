import { NextResponse, type NextRequest } from 'next/server';
import {
    type CreateBetRequest,
    type ListBetsResponse,
    BetMarket,
    BetSource,
    BetStatus,
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

const unconfigured = () =>
    NextResponse.json(
        { error: 'Bet tracking is not configured.' },
        { status: 503 },
    );

/** Coerce a raw query value into a known enum member, or undefined. */
function asEnum<T extends Record<string, string>>(
    enumObj: T,
    value: string | null,
): T[keyof T] | undefined {
    if (!value) return undefined;
    const values = Object.values(enumObj) as string[];
    return values.includes(value) ? (value as T[keyof T]) : undefined;
}

/**
 * GET /api/admin/bets
 *
 * Lists bets via the MCP Bet API, forwarding the filters `listBets` supports
 * (source, status, sport, market, limit, offset). Admin-gated before any
 * upstream call; 503 when the MCP client is unconfigured.
 */
export async function GET(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard) return guard;

    if (!mcpConfigured()) return unconfigured();

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const api = createApi(session?.access_token);

    const sp = new URL(req.url).searchParams;
    const limitRaw = sp.get('limit');
    const offsetRaw = sp.get('offset');
    const sport = sp.get('sport');

    const query = {
        source: asEnum(BetSource, sp.get('source')),
        status: asEnum(BetStatus, sp.get('status')),
        sport: sport ?? undefined,
        market: asEnum(BetMarket, sp.get('market')),
        limit: limitRaw ? Number(limitRaw) : undefined,
        offset: offsetRaw ? Number(offsetRaw) : undefined,
    };

    try {
        const res = await api.api.listBets(query);
        const payload = unwrapApiResponse<ListBetsResponse>(res);
        return NextResponse.json(payload);
    } catch (e) {
        console.error('Admin: failed to list bets', e);
        return NextResponse.json(
            { error: 'Failed to list bets' },
            { status: 502 },
        );
    }
}

/**
 * POST /api/admin/bets — log a new bet. Body is the MCP {@link CreateBetRequest}.
 */
export async function POST(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard) return guard;

    if (!mcpConfigured()) return unconfigured();

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const api = createApi(session?.access_token);

    try {
        const body = (await req.json()) as CreateBetRequest;
        const res = await api.api.createBet(body);
        const created = unwrapApiResponse(res);
        return NextResponse.json(created, { status: 201 });
    } catch (e) {
        console.error('Admin: failed to create bet', e);
        return NextResponse.json(
            { error: 'Failed to create bet' },
            { status: 502 },
        );
    }
}
