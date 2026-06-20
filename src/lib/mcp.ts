import { Api } from '@bryandebaun/mcp-client';

/**
 * Create an MCP API client with proper authentication headers
 * @param userToken - Optional Supabase JWT for authenticated requests
 */
export function createApi(userToken?: string) {
    // Normalize provided base URL so callers can't accidentally include the '/api' path
    // or trailing slashes which would create double `/api` segments when the client
    // requests paths like `/api/books/{id}`.
    let baseURL = process.env.MCP_BASE_URL || 'https://bad-mcp.onrender.com';
    baseURL = baseURL.replace(/\/+$/u, ''); // strip trailing slashes
    if (baseURL.endsWith('/api')) {
        baseURL = baseURL.slice(0, -4); // remove a mistaken '/api' suffix
    }

    // Add safe default headers for server-to-server requests. Cloudflare and other
    // bot mitigation layers sometimes challenge requests missing an Accept header
    // or a User-Agent. This reduces the chance of being served an HTML challenge.
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': process.env.MCP_USER_AGENT || 'bryandebaun.dev',
    };

    // Prefer Supabase JWT if provided (user-authenticated requests)
    // Otherwise fall back to MCP_API_KEY for server-to-server requests
    const authToken = userToken || process.env.MCP_API_KEY;
    const hasAuth = Boolean(authToken);
    const apiKey = process.env.MCP_API_KEY;

    // When a Supabase JWT is provided for admin routes, the MCP server runs two auth
    // layers in sequence:
    //   1. mcpAuthMiddleware – the gateway key, accepted EITHER as
    //      `Authorization: Bearer <MCP_API_KEY>` OR via the `X-Mcp-Api-Key` header.
    //   2. jwtMiddleware + TSOA @Security('jwt',['admin']) – expects
    //      `Authorization: Bearer <Supabase JWT>`.
    //
    // These conflict over the Authorization header, so the server treats
    // `X-Mcp-Api-Key` as a first-class second factor (NOT deprecated — see the
    // server's src/http/middleware/mcp-auth.ts): send the JWT in Authorization for
    // layer 2 and the gateway key in X-MCP-Api-Key for layer 1, satisfying both at
    // once. When no JWT is provided we use the API key in Authorization (the
    // standard read-only path).
    if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
        if (apiKey) {
            // Required second factor: satisfies layer 1 (mcpAuthMiddleware) without
            // occupying Authorization, which layer 2 needs for the JWT.
            headers['X-MCP-Api-Key'] = apiKey;
        }
    } else if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // DEV / DEBUG: log resolved baseURL and whether we will send Authorization header.
    // Controlled by DEBUG_MCP=1 to avoid leaking info in production. When enabled, add a
    // non-sensitive debug header so upstream logs can easily correlate requests from
    // development/preview instances.
    try {
        const debug =
            process.env.DEBUG_MCP === '1' ||
            (process.env.NODE_ENV !== 'production' &&
                process.env.DEBUG_MCP !== '0');
        if (debug) {
            // Do NOT log the API key itself — only indicate presence of auth and the base URL.
            console.info('createApi', {
                baseURL,
                hasAuth,
                authType: userToken ? 'supabase' : 'api-key',
            });
            // Non-sensitive debug header to aid correlation in upstream logs when troubleshooting
            // preview or CI requests. It should never include secrets.
            headers['X-Debug-MCP'] =
                process.env.DEBUG_MCP === '1' ? '1' : 'dev';
        }
    } catch {
        // ignore logging errors
    }

    // Use securityWorker to guarantee the Authorization header is injected for all
    // @secure endpoints (the generated client merges securityWorker output into the
    // per-request headers, which takes precedence over instance defaults).
    const api = new Api({
        baseURL,
        headers,
        securityWorker: (token) =>
            typeof token === 'string'
                ? { headers: { Authorization: `Bearer ${token}` } }
                : undefined,
    });
    if (authToken) {
        api.setSecurityData(authToken);
    }
    return api;
}
