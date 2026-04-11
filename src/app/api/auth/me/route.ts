import { NextResponse, type NextRequest } from 'next/server';
import { proxyCall } from '@/lib/mcp-proxy';
import { Api } from '@bryandebaun/mcp-client';

export async function GET(req: NextRequest) {
    try {
        // For user session endpoints, forward the session cookie instead of using API key
        const cookie = req.headers.get('cookie');
        const baseURL = (process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com').replace(/\/+$/u, '');

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'User-Agent': process.env.MCP_USER_AGENT || 'bryandebaun.dev'
        };

        if (cookie) {
            headers['Cookie'] = cookie;
        }

        const api = new Api({ baseURL, headers });
        const result = await proxyCall<unknown>((a) => a.api.get(), api);
        return NextResponse.json(result.body, { status: result.status });
    } catch (e) {
        console.error('Auth session proxy failed', e);
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 502 });
    }
}
