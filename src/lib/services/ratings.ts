import type { RatingWithDetails } from '@bryandebaun/mcp-client';
import { fetchWithFallback } from '@/lib/server-fetch';

export async function listRatings(query?: { bookId?: number }): Promise<RatingWithDetails[]> {
    const qs = query?.bookId ? `?bookId=${query.bookId}` : '';
    const res = await fetchWithFallback(`/api/mcp/ratings${qs}`);
    if (!res.ok) return [];
    const payload = await res.json();
    return payload?.ratings ?? [];
}
