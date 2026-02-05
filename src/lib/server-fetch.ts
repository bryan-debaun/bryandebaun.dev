/**
 * Server-safe fetch that retries with an absolute origin if the runtime rejects
 * relative URLs, and applies a request timeout. If requests fail or time out,
 * we return a safe empty JSON response (HTTP 504) so builds and SSR don't hang.
 */
export async function fetchWithFallback(path: string, init?: RequestInit, timeoutMs = 15000) {
    const makeRequest = (url: string, init?: RequestInit) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        const mergedInit = { ...init, signal: controller.signal } as RequestInit;
        return fetch(url, mergedInit).finally(() => clearTimeout(id));
    };

    try {
        return await makeRequest(path, init);
    } catch (err: unknown) {
        // If we got a parse error for relative URLs in certain runtimes, retry with an origin
        if (typeof err === 'object' && err !== null) {
            const message = (err as { message?: unknown }).message;
            if (typeof message === 'string' && message.includes('Failed to parse URL')) {
                // Prefer a configured public URL (NEXT_PUBLIC_SITE_URL). If running on Vercel,
                // the VERCEL_URL env var contains the deployment hostname (preview domains).
                const origin = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3000}`);
                let retryErr: unknown;
                try {
                    return await makeRequest(`${origin}${path}`, init);
                } catch (err2) {
                    // Include diagnostic logging for the retry failure so preview builds can show details
                    retryErr = err2;
                    console.error('fetchWithFallback retry failed', { path, origin, err: err2 });
                    // fall through to return a safe fallback response below
                }

                // Attach retry error info so debug output can include both the original and retry error
                if (retryErr) {
                    try { (err as any).retryError = retryErr; } catch { /* ignore */ }
                }
            }
        }

        // Log the original error so we can diagnose preview failures (will appear in server logs)
        try {
            console.error('fetchWithFallback error', { path, err });
        } catch {
            // ignore logging failures
        }

        // On timeout or other network-related failures, return a JSON response with 504 status.
        // When `DEBUG_FETCH=1` is set in env, include an escaped message to assist diagnosis
        // in preview environments (do not expose detailed errors by default in production).
        const debug = process.env.DEBUG_FETCH === '1' || process.env.NODE_ENV !== 'production' && process.env.DEBUG_FETCH !== '0';
        const body: { error: string; debug?: string } = { error: 'Failed to fetch' };
        if (debug) {
            const original = String(err);
            const retryInfo = (err as any)?.retryError ? String((err as any).retryError) : undefined;
            body.debug = retryInfo ? `${original}; retry: ${retryInfo}` : original;
        }

        return new Response(JSON.stringify(body), {
            status: 504,
            headers: { 'content-type': 'application/json' },
        });
    }
}

