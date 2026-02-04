import type { Api as ApiType } from '@bryandebaun/mcp-client';
import { unwrapApiResponse } from '@/lib/api-response';
import { createApi } from './mcp';

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
        return { status: 200, body: payload };
    } catch (e: unknown) {
        console.error('MCP Proxy error', e);
        const status = (e as { response?: { status?: number } })?.response?.status ?? 502;
        return { status, body: { error: 'Failed to fetch from MCP' } };
    }
}
