import { NextResponse, type NextRequest } from 'next/server';
import type { UpdateBookRequest } from '@bryandebaun/mcp-client';
import { requireAdmin } from '@/lib/auth-guard';
import { unwrapApiResponse } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';

import { createApi as _createApi } from '@/lib/mcp';
export function createApi(token?: string) {
    return _createApi(token);
}

export async function PATCH(
    req: NextRequest,
    context: { params: { id: string } | Promise<{ id: string }> },
) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const params = await context.params;
    const id = Number(params.id);
    const api = createApi(session?.access_token);

    try {
        const { rating: _rating, ...mcpPayload } =
            (await req.json()) as UpdateBookRequest & {
                rating?: number | null;
            };
        const res = await api.api.updateBook(id, mcpPayload);
        const updated = unwrapApiResponse(res);
        return NextResponse.json(updated);
    } catch (e) {
        console.error('Admin: failed to update book', e);
        return NextResponse.json(
            { error: 'Failed to update book' },
            { status: 502 },
        );
    }
}

export async function DELETE(
    _req: NextRequest,
    context: { params: { id: string } | Promise<{ id: string }> },
) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const params = await context.params;
    const id = Number(params.id);
    const api = createApi(session?.access_token);

    try {
        await api.api.deleteBook(id);
        return new NextResponse(null, { status: 204 });
    } catch (e) {
        console.error('Admin: failed to delete book', e);
        return NextResponse.json(
            { error: 'Failed to delete book' },
            { status: 502 },
        );
    }
}
