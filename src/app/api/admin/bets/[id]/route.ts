import { NextResponse, type NextRequest } from 'next/server';
import type { UpdateBetRequest } from '@bryandebaun/mcp-client';
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

/**
 * PUT /api/admin/bets/[id] — edit a bet (details or closing line for CLV).
 */
export async function PUT(
    req: NextRequest,
    context: { params: { id: string } | Promise<{ id: string }> },
) {
    const guard = await requireAdmin();
    if (guard) return guard;

    if (!mcpConfigured()) return unconfigured();

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const params = await context.params;
    const id = Number(params.id);
    const api = createApi(session?.access_token);

    try {
        const body = (await req.json()) as UpdateBetRequest;
        const res = await api.api.updateBet(id, body);
        const updated = unwrapApiResponse(res);
        return NextResponse.json(updated);
    } catch (e) {
        console.error('Admin: failed to update bet', e);
        return NextResponse.json(
            { error: 'Failed to update bet' },
            { status: 502 },
        );
    }
}

/**
 * DELETE /api/admin/bets/[id] — remove a bet.
 */
export async function DELETE(
    _req: NextRequest,
    context: { params: { id: string } | Promise<{ id: string }> },
) {
    const guard = await requireAdmin();
    if (guard) return guard;

    if (!mcpConfigured()) return unconfigured();

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const params = await context.params;
    const id = Number(params.id);
    const api = createApi(session?.access_token);

    try {
        await api.api.deleteBet(id);
        return new NextResponse(null, { status: 204 });
    } catch (e) {
        console.error('Admin: failed to delete bet', e);
        return NextResponse.json(
            { error: 'Failed to delete bet' },
            { status: 502 },
        );
    }
}
