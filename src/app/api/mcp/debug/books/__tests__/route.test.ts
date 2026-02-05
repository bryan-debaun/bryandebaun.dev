import { describe, it, expect, vi } from 'vitest';
import * as route from '../[id]/route';

describe('GET /api/mcp/debug/books/[id]', () => {
    it('returns MCP tool result when configured', async () => {
        process.env.VERCEL_MCP_URL = 'https://mcp.vercel.com/my-team/my-prj';
        process.env.VERCEL_MCP_TOKEN = 'token-123';

        const fakeToolResponse = { status: 200, headers: { 'content-type': 'text/html', server: 'vercel', 'cf-ray': 'abc' }, body: '<html>ok</html>' };
        global.fetch = vi.fn().mockImplementation(async (url: any, _init?: any) => {
            // First call is to the MCP tool
            if (String(url).includes('/tools/web_fetch_vercel_url')) {
                return new Response(JSON.stringify({ result: fakeToolResponse }), { status: 200, headers: { 'content-type': 'application/json' } });
            }
            // Anything else: fallback
            return new Response('fallback', { status: 200, headers: { 'content-type': 'text/plain' } });
        });

        const res = (await route.GET(new Request('http://localhost/api/mcp/debug/books/1'), { params: { id: '1' } as any })) as Response;
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.upstream.status).toBe(200);
        expect(json.upstream.headers['cf-ray']).toBe('abc');
        expect(json.upstream.bodySample).toContain('<html>ok</html>');

        delete process.env.VERCEL_MCP_URL;
        delete process.env.VERCEL_MCP_TOKEN;
    });

    it('falls back to direct fetch when MCP tool is not configured or fails', async () => {
        delete process.env.VERCEL_MCP_URL;
        delete process.env.VERCEL_MCP_TOKEN;

        global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200, headers: { 'content-type': 'application/json' } }));

        const res = (await route.GET(new Request('http://localhost/api/mcp/debug/books/1'), { params: { id: '1' } as any })) as Response;
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.upstream.status).toBe(200);
        expect(json.upstream.bodySample).toContain('"id":1');
    });
});
