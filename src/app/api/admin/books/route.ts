import { NextResponse, type NextRequest } from 'next/server';
import type { CreateBookRequest } from '@bryandebaun/mcp-client';
import { requireAdmin } from '@/lib/auth-guard';
import { unwrapApiResponse } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';

import { createApi as _createApi } from '@/lib/mcp';
export function createApi(token?: string) {
    return _createApi(token);
}

export async function POST(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const api = createApi(session?.access_token);

    try {
        const { rating: _rating, ...mcpPayload } =
            (await req.json()) as CreateBookRequest & {
                rating?: number | null;
            };
        const res = await api.api.createBook(mcpPayload);
        const created = unwrapApiResponse(res);
        return NextResponse.json(created, { status: 201 });
    } catch (e) {
        console.error('Admin: failed to create book', e);
        return NextResponse.json(
            { error: 'Failed to create book' },
            { status: 502 },
        );
    }
}
