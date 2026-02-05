import type { RatingWithDetails, ListRatingsResponse } from '@bryandebaun/mcp-client';
import type { AxiosResponse } from 'axios';
import { fetchWithFallback } from '@/lib/server-fetch';
import { createApi } from '@/lib/mcp';
import { unwrapApiResponse } from '@/lib/api-response';
import { looksLikeHtmlPayload } from '@/lib/mcp-proxy';

export async function listRatings(query?: { bookId?: number }): Promise<RatingWithDetails[]> {
    // Server-side direct call to MCP client for reliability in preview builds
    if (typeof window === 'undefined') {
        try {
            const api = createApi();
            const res = await api.api.listRatings(query ? { bookId: query.bookId } : undefined);
            const payload = unwrapApiResponse<ListRatingsResponse>(res);

            if (await looksLikeHtmlPayload(payload)) {
                console.error('listRatings: detected HTML payload from MCP; falling back to proxy');
                throw new Error('Upstream returned HTML');
            }

            return payload?.ratings ?? [];
        } catch (e) {
            console.error('listRatings direct MCP call failed; falling back to proxy', e);
            const qs = query?.bookId ? `?bookId=${query.bookId}` : '';
            const resProxy = await fetchWithFallback(`/api/mcp/ratings${qs}`);
            if (!resProxy || !resProxy.ok) return [];
            const payload = await resProxy.json();
            return payload?.ratings ?? [];
        }
    }

    const qs = query?.bookId ? `?bookId=${query.bookId}` : '';
    const res = await fetchWithFallback(`/api/mcp/ratings${qs}`);
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.ratings ?? [];
}
