import { NextResponse, type NextRequest } from 'next/server';
import { fetchWithFallback } from '@/lib/server-fetch';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetchWithFallback('/api/mcp/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        const text = await res.text();
        // Mirror upstream status and body, including Set-Cookie if present
        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => (headers[k] = v));
        return new NextResponse(text, { status: res.status, headers });
    } catch (e) {
        console.error('Auth login proxy failed', e);
        return NextResponse.json({ error: 'Failed to login' }, { status: 502 });
    }
}
