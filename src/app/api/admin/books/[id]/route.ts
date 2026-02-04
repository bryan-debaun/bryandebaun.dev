import { NextResponse, type NextRequest } from 'next/server';
import { UpdateBookRequest } from '@bryandebaun/mcp-client';
function unwrapApiResponse<T>(res: unknown): T {
    if (typeof res === 'object' && res !== null && 'data' in res) {
        return (res as { data: T }).data;
    }
    return res as T;
}

import { createApi as _createApi } from '@/lib/mcp';
export function createApi() {
    return _createApi();
}

// NOTE: This route is intentionally minimal for the prototype. Add auth/role checks here.
export async function PATCH(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
    const params = await context.params;
    const id = Number(params.id);
    const api = createApi();

    try {
        const payload = (await req.json()) as UpdateBookRequest;
        const res = await api.api.updateBook(id, payload);
        const updated = unwrapApiResponse(res);
        return NextResponse.json(updated);
    } catch (e) {
        console.error('Admin: failed to update book', e);
        return NextResponse.json({ error: 'Failed to update book' }, { status: 502 });
    }
}
