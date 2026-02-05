import { Api } from '@bryandebaun/mcp-client';

export function createApi() {
    const baseURL = process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com';

    // Add safe default headers for server-to-server requests. Cloudflare and other
    // bot mitigation layers sometimes challenge requests missing an Accept header
    // or a User-Agent. This reduces the chance of being served an HTML challenge.
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': process.env.MCP_USER_AGENT || 'bryandebaun.dev'
    };

    // If an MCP API key is present in env, send it as a server-only header to identify
    // requests originating from this site. The MCP server should validate this header.
    if (process.env.MCP_API_KEY) {
        headers['x-mcp-api-key'] = process.env.MCP_API_KEY;
    }

    return new Api({ baseURL, headers });
}
