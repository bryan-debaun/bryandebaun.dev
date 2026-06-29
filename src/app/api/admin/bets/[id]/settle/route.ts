import { NextResponse, type NextRequest } from 'next/server';
import type { SettleBetRequest } from '@bryandebaun/mcp-client';
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

/**
 * POST /api/admin/bets/[id]/settle — settle a bet outcome
 * (WON | LOST | PUSH | VOID). Payout is auto-computed on a win upstream.
 */
export async function POST(
    req: NextRequest,
    context: { params: { id: string } | Promise<{ id: string }> },
) {
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
    const params = await context.params;
    const id = Number(params.id);
    const api = createApi(session?.access_token);

    try {
        const body = (await req.json()) as SettleBetRequest;
        const res = await api.api.settleBet(id, body);
        const settled = unwrapApiResponse(res);
        return NextResponse.json(settled);
    } catch (e) {
        console.error('Admin: failed to settle bet', e);
        return NextResponse.json(
            { error: 'Failed to settle bet' },
            { status: 502 },
        );
    }
}
