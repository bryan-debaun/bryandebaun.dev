import { NextResponse, type NextRequest } from 'next/server';
import { fetchWithFallback } from '@/lib/server-fetch';

export async function GET(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');
        if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        if (debug) console.info('auth.magic-link.verify: proxying GET verify', { token: `${token.slice(0, 6)}…` });

        const res = await fetchWithFallback(`/api/mcp/auth/magic-link/verify?token=${encodeURIComponent(token)}`, { method: 'GET' });
        const text = await res.text();

        if (!res.ok) {
            if (debug) {
                console.error('auth.magic-link.verify: upstream returned non-2xx', { status: res.status, body: text });
                const headers: Record<string, string> = {};
                res.headers.forEach((v, k) => (headers[k] = v));
                return new NextResponse(text, { status: res.status, headers });
            } else {
                console.warn('auth.magic-link.verify: upstream returned non-2xx (sanitized response)', { status: res.status });
                return NextResponse.json({ error: 'Failed to verify token' }, { status: res.status });
            }
        }

        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => (headers[k] = v));
        if (debug) console.info('auth.magic-link.verify: success', { status: res.status });
        return new NextResponse(text, { status: res.status, headers });
    } catch (e) {
        console.error('Auth magic-link verify GET proxy failed', e);
        return NextResponse.json({ error: 'Failed to verify' }, { status: 502 });
    }
}

export async function POST(req: NextRequest) {
    const debug = process.env.DEBUG_AUTH === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH !== '0');

    try {
        const body = await req.json();
        const token = body?.token;
        if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        if (debug) console.info('auth.magic-link.verify: proxying POST verify', { token: `${token.slice(0, 6)}…` });

        const res = await fetchWithFallback('/api/mcp/auth/magic-link/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
        const text = await res.text();

        if (!res.ok) {
            if (debug) {
                console.error('auth.magic-link.verify: upstream returned non-2xx', { status: res.status, body: text });
                const headers: Record<string, string> = {};
                res.headers.forEach((v, k) => (headers[k] = v));
                return new NextResponse(text, { status: res.status, headers });
            } else {
                console.warn('auth.magic-link.verify: upstream returned non-2xx (sanitized response)', { status: res.status });
                return NextResponse.json({ error: 'Failed to verify token' }, { status: res.status });
            }
        }

        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => (headers[k] = v));
        if (debug) console.info('auth.magic-link.verify: success', { status: res.status });
        return new NextResponse(text, { status: res.status, headers });
    } catch (e) {
        console.error('Auth magic-link verify POST proxy failed', e);
        return NextResponse.json({ error: 'Failed to verify' }, { status: 502 });
    }
}
