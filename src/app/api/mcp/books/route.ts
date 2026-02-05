import { NextResponse } from 'next/server';
import { ListBooksResponse } from '@bryandebaun/mcp-client';
import { proxyCall } from '@/lib/mcp-proxy';

import { createApi as _createApi } from '@/lib/mcp';
export function createApi() {
    return _createApi();
}

export async function GET() {
    // Import the module namespace dynamically so tests can spy on the exported `createApi` function.
    const mod = await import('./route');
    const api = mod.createApi();

    // Delegate to the proxy helper which normalizes response + errors.
    const result = await proxyCall<ListBooksResponse>((a) => a.api.listBooks(), api);
    return NextResponse.json(result.body, { status: result.status });
}
