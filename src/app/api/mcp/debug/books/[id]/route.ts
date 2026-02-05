import { NextResponse, type NextRequest } from 'next/server';

// Temporary debug endpoint - server-only
// GET /api/mcp/debug/books/[id]
// Calls the upstream MCP book endpoint directly (using MCP_BASE_URL + Authorization) and
// returns the upstream status, a small text sample of the response body, and a few
// safe headers (no secrets returned). This helps diagnose Cloudflare/WAF behavior from
// the preview deployment.

export async function GET(_req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
    const params = await context.params;
    const id = params.id;

    const base = (process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com').replace(/\/+$/u, '');
    const url = `${base}/api/books/${id}`;

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': process.env.MCP_USER_AGENT || 'bryandebaun.dev-debug',
    };

    if (process.env.MCP_API_KEY) headers['Authorization'] = `Bearer ${process.env.MCP_API_KEY}`;
    if (process.env.DEBUG_MCP === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_MCP !== '0')) {
        headers['X-Debug-MCP'] = process.env.DEBUG_MCP === '1' ? '1' : 'dev';
    }

    try {
        // If Vercel MCP is configured, prefer using its `web_fetch_vercel_url` tool
        // to fetch preview-protected URLs. This avoids SSO pages blocking our debug
        // fetches from preview deployments.
        if (process.env.VERCEL_MCP_URL && process.env.VERCEL_MCP_TOKEN) {
            try {
                const mcpTool = `${process.env.VERCEL_MCP_URL.replace(/\/+$/u, '')}/tools/web_fetch_vercel_url`;
                const mcpRes = await fetch(mcpTool, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        Authorization: `Bearer ${process.env.VERCEL_MCP_TOKEN}`,
                    },
                    body: JSON.stringify({ url }),
                });

                // MCP tool may return JSON with { status, headers, body } or nest it under 'result'.
                const mcpJson = await mcpRes.json().catch(() => null);
                const maybe = mcpJson && (mcpJson.result ?? mcpJson);
                if (mcpRes.ok && maybe) {
                    const safeHeaders: Record<string, string | undefined> = {
                        'content-type': maybe.headers?.['content-type'] ?? maybe.headers?.['content-type'] ?? undefined,
                        'server': maybe.headers?.server ?? undefined,
                        'cf-ray': maybe.headers?.['cf-ray'] ?? maybe.headers?.cf_ray ?? undefined,
                    };

                    const bodySample = typeof maybe.body === 'string' ? maybe.body.slice(0, 4096) : String(maybe.body ?? '').slice(0, 4096);

                    return NextResponse.json({ upstream: { url, status: maybe.status ?? mcpRes.status, headers: safeHeaders, bodySample } }, { status: 200 });
                }

                // Fall through: if MCP returned non-ok, try a direct fetch as fallback below
                console.error('debug proxy: MCP tool returned non-ok', { mcpTool, status: mcpRes.status, body: mcpJson });
            } catch (mcpErr) {
                console.error('debug proxy: MCP tool call failed', mcpErr);
                // fall back to direct fetch below
            }
        }

        const res = await fetch(url, { headers });
        const text = await res.text().catch(() => '');

        // Pick a few safe headers to return for diagnosis
        const safeHeaders: Record<string, string | undefined> = {
            'content-type': res.headers.get('content-type') ?? undefined,
            'server': res.headers.get('server') ?? undefined,
            'cf-ray': res.headers.get('cf-ray') ?? undefined,
        };

        return NextResponse.json(
            {
                upstream: {
                    url,
                    status: res.status,
                    headers: safeHeaders,
                    bodySample: text.slice(0, 4096),
                },
            },
            { status: 200 },
        );
    } catch (e) {
        console.error('debug proxy fetch failed', e);
        return NextResponse.json({ error: 'debug fetch failed' }, { status: 502 });
    }
}
