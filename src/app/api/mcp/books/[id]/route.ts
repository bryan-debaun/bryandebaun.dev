import { NextResponse, type NextRequest } from 'next/server';
import { BookWithAuthors } from '@bryandebaun/mcp-client';
import { proxyCall } from '@/lib/mcp-proxy';

import { createApi as _createApi } from '@/lib/mcp';
export function createApi() {
    return _createApi();
}

export async function GET(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
    const params = await context.params;
    const id = Number(params.id);
    // Import the module namespace dynamically so tests can spy on the exported `createApi` function.
    const mod = await import('./route');
    const api = mod.createApi();

    const result = await proxyCall<BookWithAuthors>((a) => a.api.getBook(id), api);
    return NextResponse.json(result.body, { status: result.status });
}
