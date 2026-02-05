import type { RatingWithDetails } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';
import { createApi } from '@/lib/mcp';

export async function listRatings(query?: { bookId?: number }): Promise<RatingWithDetails[]> {
    // Server-side direct call to MCP client for reliability in preview builds
    if (typeof window === 'undefined') {
        try {
            const api = createApi();
            const res = await api.api.listRatings(query ? { bookId: query.bookId } : undefined);
            const payload = (res as any).data ?? res;
            return payload?.ratings ?? [];
        } catch (e) {
            console.error('listRatings direct MCP call failed', e);
            return [];
        }
    }

    const qs = query?.bookId ? `?bookId=${query.bookId}` : '';
    const res = await fetchWithFallback(`/api/mcp/ratings${qs}`);
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.ratings ?? [];
}
