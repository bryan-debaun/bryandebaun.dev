export async function fetchWithFallback(path: string, init?: RequestInit) {
    try {
        return await fetch(path, init)
    } catch (err: unknown) {
        if (typeof err === 'object' && err !== null) {
            const message = (err as { message?: unknown }).message
            if (typeof message === 'string' && message.includes('Failed to parse URL')) {
                const origin = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`
                return await fetch(`${origin}${path}`, init)
            }
        }
        throw err
    }
}

