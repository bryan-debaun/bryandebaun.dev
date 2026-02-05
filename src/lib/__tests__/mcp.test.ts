import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@bryandebaun/mcp-client', () => ({ Api: vi.fn() }));

describe('createApi header behavior', () => {
    afterEach(async () => {
        vi.resetModules();
        delete process.env.MCP_API_KEY;
        const { Api } = await import('@bryandebaun/mcp-client');
        if ((Api as any).mock && typeof (Api as any).mockReset === 'function') {
            (Api as any).mockReset();
        }
    });

    it('includes x-mcp-api-key header when MCP_API_KEY is set', async () => {
        process.env.MCP_API_KEY = 'super-secret';
        // import after setting env so module reads it fresh
        const { createApi } = await import('@/lib/mcp');
        createApi();
        const { Api } = await import('@bryandebaun/mcp-client');
        const callArg = (Api as any).mock.calls[0][0];
        expect(callArg.headers['x-mcp-api-key']).toBe('super-secret');
    });

    it('does not include x-mcp-api-key header when MCP_API_KEY is not set', async () => {
        delete process.env.MCP_API_KEY;
        const { createApi } = await import('@/lib/mcp');
        createApi();
        const { Api } = await import('@bryandebaun/mcp-client');
        const callArg = (Api as any).mock.calls[0][0];
        expect(callArg.headers['x-mcp-api-key']).toBeUndefined();
    });
});