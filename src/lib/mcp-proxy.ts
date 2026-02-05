import type { Api as ApiType } from '@bryandebaun/mcp-client';
import { unwrapApiResponse } from '@/lib/api-response';
import { createApi } from './mcp';

/**
 * Return true if the provided payload appears to be an unexpected HTML body.
 * This will safely handle plain strings, Axios-like objects with a `data` string,
 * or Response-like objects that expose `text()`.
 */
export async function looksLikeHtmlPayload(payload: unknown): Promise<boolean> {
    try {
        if (typeof payload === 'string') {
            const trimmed = payload.trim().toLowerCase();
            return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
        }

        if (typeof payload === 'object' && payload !== null) {
            const maybeData = (payload as any).data;
            if (typeof maybeData === 'string') {
                const trimmed = maybeData.trim().toLowerCase();
                if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) return true;
            }

            if (typeof (payload as any).text === 'function') {
                try {
                    const txt = await (payload as any).text();
                    if (typeof txt === 'string') {
                        const trimmed = txt.trim().toLowerCase();
                        return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
                    }
                } catch {
                    // ignore text() read errors; treat as not HTML
                }
            }
        }

        return false;
    } catch {
        return false;
    }
}

export interface ProxyResult<T = unknown> {
    status: number;
    body: T | { error: string };
}

/**
 * Proxy a call to the generated MCP client and normalize the response into a status/body shape.
 * Optionally accepts an existing Api instance (useful for tests that spy on route-local factories).
 */
export async function proxyCall<T = unknown>(
    fn: (api: ApiType<unknown>) => Promise<unknown>,
    apiInstance?: ApiType<unknown>,
): Promise<ProxyResult<T>> {
    const api = apiInstance ?? createApi();

    try {
        const res = await fn(api);
        const payload = unwrapApiResponse<T>(res);

        // Use a shared helper to detect HTML-like payloads (Cloudflare challenge pages, etc.)
        if (await looksLikeHtmlPayload(payload)) {
            console.error('MCP Proxy error: upstream returned HTML (possible Cloudflare challenge)');
            return { status: 502, body: { error: 'Failed to fetch from MCP' } };
        }

        return { status: 200, body: payload };
    } catch (e: unknown) {
        console.error('MCP Proxy error', e);
        const status = (e as { response?: { status?: number } })?.response?.status ?? 502;
        return { status, body: { error: 'Failed to fetch from MCP' } };
    }
}
