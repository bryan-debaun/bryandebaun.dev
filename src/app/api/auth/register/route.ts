import { NextResponse, type NextRequest } from 'next/server';
import { fetchWithFallback } from '@/lib/server-fetch';

export async function POST(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const body = await req.json();
        const maskedEmail = typeof body?.email === 'string' ? body.email.replace(/(.{2}).+(@.+)/, '$1***$2') : undefined;
        if (debug) console.info('auth.register: proxying registration', { email: maskedEmail, mcpBase: Boolean(process.env.MCP_BASE_URL) });

        const res = await fetchWithFallback('/api/mcp/auth/magic-link/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        const text = await res.text();

        // If upstream returned a non-2xx, log details when debugging. In prod return a
        // sanitized message to avoid leaking internal upstream errors to end users.
        if (!res.ok) {
            if (debug) {
                console.error('auth.register: upstream returned non-2xx', { status: res.status, body: text });
                const headers: Record<string, string> = {};
                res.headers.forEach((v, k) => (headers[k] = v));
                return new NextResponse(text, { status: res.status, headers });
            } else {
                // Production/sanitized response
                console.warn('auth.register: upstream returned non-2xx (sanitized response)', { status: res.status });
                return NextResponse.json({ error: 'Registration failed' }, { status: res.status });
            }
        }

        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => (headers[k] = v));
        if (debug) console.info('auth.register: success', { status: res.status });
        return new NextResponse(text, { status: res.status, headers });
    } catch (e) {
        console.error('Auth register proxy failed', e);
        return NextResponse.json({ error: 'Failed to register' }, { status: 502 });
    }
}
