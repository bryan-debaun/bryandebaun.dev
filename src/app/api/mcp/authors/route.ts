import { NextResponse } from 'next/server';
import { ListAuthorsResponse } from '@bryandebaun/mcp-client';
import { proxyCall } from '@/lib/mcp-proxy';

import { createApi as _createApi } from '@/lib/mcp';
export function createApi() {
    return _createApi();
}

export async function GET() {
    // Import the module namespace dynamically so tests can spy on the exported `createApi` function.
    const mod = await import('./route');
    const api = mod.createApi();

    try {
        const result = await proxyCall<ListAuthorsResponse>((a) => a.api.listAuthors(), api);
        return NextResponse.json(result.body, { status: result.status });
    } catch (e) {
        console.error('MCP: failed to fetch authors', e);
        return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 502 });
    }
}
