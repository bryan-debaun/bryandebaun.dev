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
            const maybeData = (payload as { data?: unknown }).data;
            if (typeof maybeData === 'string') {
                const trimmed = maybeData.trim().toLowerCase();
                if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) return true;
            }

            const textFn = (payload as { text?: unknown }).text;
            if (typeof textFn === 'function') {
                try {
                    // `textFn` may be synchronous or return a Promise (Response-like). Await its result.
                    const txt = await (textFn as () => Promise<unknown>)();
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

    // When debugging is enabled, capture which generated client method is being invoked
    // and whether the resolved Api instance will send Authorization or debug headers.
    const debug = process.env.DEBUG_MCP === '1' || (process.env.NODE_ENV !== 'production' && process.env.DEBUG_MCP !== '0');
    let callInfo: { method?: string; args?: unknown[] } | undefined;

    // If debug is enabled, wrap the `api.api` object so we can record method invocations and args.
    const apiToCall = debug
        ? ({
              ...api,
              api: new Proxy((api as any).api as object, {
                  get(target, prop) {
                      const orig = (target as any)[prop as string];
                      if (typeof orig === 'function') {
                          return (...args: unknown[]) => {
                              callInfo = { method: String(prop), args };
                              return orig.apply(target, args);
                          };
                      }
                      return orig;
                  },
              }),
          } as ApiType<unknown>)
        : api;

    try {
        if (debug && callInfo === undefined) {
            // Pre-notify that we're about to call the client (method will be recorded by the proxy wrapper)
            const hasAuthHeader = Boolean((api as any).instance?.defaults?.headers?.Authorization || (api as any).instance?.defaults?.headers?.authorization);
            const debugHeader = (api as any).instance?.defaults?.headers?.['X-Debug-MCP'];
            console.info('MCP Proxy debug: prepared to call generated client', { baseURL: (api as any).instance?.defaults?.baseURL, hasAuth: hasAuthHeader, debugHeader });
        }

        const res = await fn(apiToCall);
        const payload = unwrapApiResponse<T>(res);

        if (debug && callInfo) {
            console.info('MCP Proxy debug: client call', { method: callInfo.method, args: callInfo.args });
        }

        // Use a shared helper to detect HTML-like payloads (Cloudflare challenge pages, etc.)
        if (await looksLikeHtmlPayload(payload)) {
            // Log a small sample of the upstream payload to aid diagnosis (do not log full HTML)
            try {
                // Try to capture any status that may have been returned by the upstream client
                const status = typeof (res as { status?: unknown })?.status === 'number' ? (res as { status?: number }).status : undefined;
                const sample = String(payload ?? '').slice(0, 512).replace(/\s+/g, ' ');
                console.error('MCP Proxy error: upstream returned HTML (possible Cloudflare challenge)', { status, sample });
            } catch {
                console.error('MCP Proxy error: upstream returned HTML (possible Cloudflare challenge)');
            }

            return { status: 502, body: { error: 'Failed to fetch from MCP' } };
        }

        return { status: 200, body: payload };
    } catch (e: unknown) {
        // When the generated client throws, it may be an AxiosError with a response property.
        try {
            const maybeResponse = (e as { response?: unknown })?.response;
            let status: number | undefined;
            let sample: string | undefined;

            if (maybeResponse && typeof maybeResponse === 'object') {
                if (typeof (maybeResponse as { status?: unknown }).status === 'number') {
                    status = (maybeResponse as { status?: number }).status;
                }
                try {
                    const data = (maybeResponse as { data?: unknown }).data;
                    sample = String(data ?? '').slice(0, 512).replace(/\s+/g, ' ');
                } catch {
                    // ignore serialization errors
                }
            }

            if (status || sample) {
                console.error('MCP Proxy error', { status, sample, error: e });
            } else {
                console.error('MCP Proxy error', e);
            }

            const resolvedStatus = status ?? 502;
            return { status: resolvedStatus, body: { error: 'Failed to fetch from MCP' } };
        } catch (logErr) {
            // If our diagnostic logging fails for any reason, fall back to a minimal log and 502
            console.error('MCP Proxy error', e);
            return { status: 502, body: { error: 'Failed to fetch from MCP' } };
        }
    }
}
