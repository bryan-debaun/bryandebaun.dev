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

    // If an MCP API key is present in env, send it as an Authorization bearer token
    // in server-to-server requests so the MCP server can validate the caller.
    const hasAuth = Boolean(process.env.MCP_API_KEY);
    if (hasAuth) {
        headers['Authorization'] = `Bearer ${process.env.MCP_API_KEY}`;
    }

    // DEV / DEBUG: log resolved baseURL and whether we will send Authorization header.
    // Controlled by DEBUG_MCP=1 to avoid leaking info in production.
    try {
        const debug = process.env.DEBUG_MCP === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_MCP !== '0');
        if (debug) {
            // Do NOT log the API key itself — only indicate presence of auth and the base URL.
            console.info('createApi', { baseURL, hasAuth });
        }
    } catch {
        // ignore logging errors
    }

    return new Api({ baseURL, headers });
}
