/**
 * Server-safe fetch that retries with an absolute origin if the runtime rejects
 * relative URLs, and applies a request timeout. If requests fail or time out,
 * we return a safe empty JSON response (HTTP 504) so builds and SSR don't hang.
 */
export async function fetchWithFallback(path: string, init?: RequestInit, timeoutMs = 15000) {
    const makeRequest = (url: string, init?: RequestInit) => {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeoutMs)
        const mergedInit = { ...init, signal: controller.signal } as RequestInit
        return fetch(url, mergedInit).finally(() => clearTimeout(id))
    }

    try {
        return await makeRequest(path, init)
    } catch (err: unknown) {
        // If we got a parse error for relative URLs in certain runtimes, retry with an origin
        if (typeof err === 'object' && err !== null) {
            const message = (err as { message?: unknown }).message
            if (typeof message === 'string' && message.includes('Failed to parse URL')) {
                const origin = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`
                try {
                    return await makeRequest(`${origin}${path}`, init)
                } catch {
                    // fall through to return a safe fallback response below
                }
            }
        }

        // On timeout or other network-related failures, return an empty JSON response
        // with a 504 status so builds and SSR can proceed gracefully.
        return new Response(JSON.stringify({}), {
            status: 504,
            headers: { 'content-type': 'application/json' },
        })
    }
}

