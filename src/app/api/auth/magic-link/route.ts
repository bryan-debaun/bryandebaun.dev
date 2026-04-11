import { NextResponse, type NextRequest } from 'next/server';
import { proxyCall } from '@/lib/mcp-proxy';
import { Api } from '@bryandebaun/mcp-client';

export async function POST(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const body = await req.json();
        const maskedEmail = typeof body?.email === 'string' ? body.email.replace(/(.{2}).+(@.+)/, '$1***$2') : undefined;
        if (debug) console.info('auth.magic-link: sending magic link', { email: maskedEmail });

        // Magic link endpoint is public, doesn't need API key
        const baseURL = (process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com').replace(/\/+$/u, '');
        const api = new Api({
            baseURL,
            headers: {
                'Accept': 'application/json',
                'User-Agent': process.env.MCP_USER_AGENT || 'bryandebaun.dev'
            }
        });

        const result = await proxyCall<{ status: string }>((a) => a.api.send(body), api);

        if (result.status !== 200) {
            if (debug) {
                console.error('auth.magic-link: non-2xx response', { status: result.status, body: result.body });
            } else {
                console.warn('auth.magic-link: non-2xx response (sanitized)', { status: result.status });
            }
        } else if (debug) {
            console.info('auth.magic-link: success', { status: result.status });
        }

        return NextResponse.json(result.body, { status: result.status });
    } catch (e) {
        console.error('Auth magic-link proxy failed', e);
        return NextResponse.json({ error: 'Failed to send magic link' }, { status: 502 });
    }
}
