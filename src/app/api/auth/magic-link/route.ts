import { NextResponse, type NextRequest } from 'next/server';
import { fetchWithFallback } from '@/lib/server-fetch';

export async function POST(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const body = await req.json();
        const maskedEmail = typeof body?.email === 'string' ? body.email.replace(/(.{2}).+(@.+)/, '$1***$2') : undefined;
        if (debug) console.info('auth.magic-link: proxying magic link', { email: maskedEmail, mcpBase: Boolean(process.env.MCP_BASE_URL) });

        const res = await fetchWithFallback('/api/mcp/auth/magic-link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        const text = await res.text();

        // Mirror upstream status/body on success. On non-2xx return sanitized message in prod.
        if (!res.ok) {
            if (debug) {
                console.error('auth.magic-link: upstream returned non-2xx', { status: res.status, body: text });
                const headers: Record<string, string> = {};
                res.headers.forEach((v, k) => (headers[k] = v));
                return new NextResponse(text, { status: res.status, headers });
            } else {
                console.warn('auth.magic-link: upstream returned non-2xx (sanitized response)', { status: res.status });
                return NextResponse.json({ error: 'Failed to send magic link' }, { status: res.status });
            }
        }

        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => (headers[k] = v));
        if (debug) console.info('auth.magic-link: success', { status: res.status });
        return new NextResponse(text, { status: res.status, headers });
    } catch (e) {
        console.error('Auth magic-link proxy failed', e);
        return NextResponse.json({ error: 'Failed to send magic link' }, { status: 502 });
    }
}
