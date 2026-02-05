import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@bryandebaun/mcp-client', () => ({ Api: vi.fn() }));

describe('createApi header behavior', () => {
    afterEach(async () => {
        vi.resetModules();
        delete process.env.MCP_API_KEY;
        delete process.env.MCP_BASE_URL;
        const { Api } = await import('@bryandebaun/mcp-client');
        if ((Api as any).mock && typeof (Api as any).mockReset === 'function') {
            (Api as any).mockReset();
        }
    });

    it('includes Authorization bearer header when MCP_API_KEY is set', async () => {
        process.env.MCP_API_KEY = 'super-secret';
        // import after setting env so module reads it fresh
        const { createApi } = await import('@/lib/mcp');
        createApi();
        const { Api } = await import('@bryandebaun/mcp-client');
        const callArg = (Api as any).mock.calls[0][0];
        expect(callArg.headers['Authorization']).toBe('Bearer super-secret');
    });

    it('normalizes MCP_BASE_URL when it includes a trailing /api', async () => {
        process.env.MCP_BASE_URL = 'https://bad-mcp.onrender.com/api';
        const { createApi } = await import('@/lib/mcp');
        createApi();
        const { Api } = await import('@bryandebaun/mcp-client');
        const callArg = (Api as any).mock.calls[0][0];
        expect(callArg.baseURL).toBe('https://bad-mcp.onrender.com');
    });

    it('removes trailing slash from MCP_BASE_URL', async () => {
        process.env.MCP_BASE_URL = 'https://bad-mcp.onrender.com/';
        const { createApi } = await import('@/lib/mcp');
        createApi();
        const { Api } = await import('@bryandebaun/mcp-client');
        const callArg = (Api as any).mock.calls[0][0];
        expect(callArg.baseURL).toBe('https://bad-mcp.onrender.com');
    });

    it('does not include Authorization header when MCP_API_KEY is not set', async () => {
        delete process.env.MCP_API_KEY;
        const { createApi } = await import('@/lib/mcp');
        createApi();
        const { Api } = await import('@bryandebaun/mcp-client');
        const callArg = (Api as any).mock.calls[0][0];
        expect(callArg.headers['Authorization']).toBeUndefined();
    });
});