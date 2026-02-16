import { NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/server-fetch';

export async function GET() {
    try {
        const res = await fetchWithFallback('/api/mcp/auth/me');
        const text = await res.text();
        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => (headers[k] = v));
        return new NextResponse(text, { status: res.status, headers });
    } catch (e) {
        console.error('Auth me proxy failed', e);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 502 });
    }
}
