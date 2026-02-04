import { NextResponse } from 'next/server';
import { ListRatingsResponse } from '@bryandebaun/mcp-client';
import { proxyCall } from '@/lib/mcp-proxy';

import { createApi as _createApi } from '@/lib/mcp';
export function createApi() {
    return _createApi();
}

export async function GET(req: Request) {
    // Import the module namespace dynamically so tests can spy on the exported `createApi` function.
    const mod = await import('./route');
    const api = mod.createApi();

    try {
        const url = new URL(req.url);
        const bookIdParam = url.searchParams.get('bookId');
        type RatingsQuery = { bookId?: number; userId?: number; minRating?: number; limit?: number; offset?: number };
        const query: RatingsQuery = {};
        if (bookIdParam) query.bookId = Number(bookIdParam);

        const result = await proxyCall<ListRatingsResponse>((a) => a.api.listRatings(Object.keys(query).length ? query : undefined), api);
        return NextResponse.json(result.body, { status: result.status });
    } catch (e: unknown) {
        console.error('MCP: failed to fetch ratings', e);

        const upstreamStatus = (e as { response?: { status?: number } })?.response?.status ?? 502;
        return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: upstreamStatus });
    }
}
