import { NextResponse, type NextRequest } from 'next/server';
import { Api, AuthorWithBooks } from '@bryandebaun/mcp-client';
import { proxyCall } from '@/lib/mcp-proxy';

export function createApi() {
    const baseURL = process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com';
    return new Api({ baseURL });
}

export async function GET(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
    const params = await context.params;
    const id = Number(params.id);
    // Import the module namespace dynamically so tests can spy on the exported `createApi` function.
    const mod = await import('./route');
    const api = mod.createApi();

    const result = await proxyCall<AuthorWithBooks>((a) => a.api.getAuthor(id), api);
    return NextResponse.json(result.body, { status: result.status });
}
