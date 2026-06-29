import type {
    Bet,
    BetAnalyticsResponse,
    CreateBetRequest,
    SettleBetRequest,
    UpdateBetRequest,
} from '@bryandebaun/mcp-client';
import type { BetFilters } from '@/lib/bets';

/**
 * Client-side repository for admin Bet operations. Talks to the `/api/admin/bets`
 * routes (which enforce auth server-side and inject the Supabase JWT + MCP
 * gateway key). No MCP credentials ever live in the browser.
 */

/** Serialize the active filters into a query string for the list/analytics routes. */
function toQueryString(
    filters: BetFilters | undefined,
    keys: (keyof BetFilters)[],
): string {
    if (!filters) return '';
    const params = new URLSearchParams();
    for (const key of keys) {
        const value = filters[key];
        if (value !== undefined && value !== '') {
            params.set(key, String(value));
        }
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
    if (res.status === 503) return 'Bet tracking is not configured.';
    const data = (await res.json().catch(() => null)) as {
        error?: string;
    } | null;
    return data?.error ?? `${fallback}: ${res.status}`;
}

/** Fetch the filtered bet log. */
export async function listBets(filters?: BetFilters): Promise<Bet[]> {
    const qs = toQueryString(filters, [
        'source',
        'status',
        'sport',
        'market',
    ]);
    const res = await fetch(`/api/admin/bets${qs}`);
    if (!res.ok) {
        throw new Error(await errorMessage(res, 'Failed to fetch bets'));
    }
    const data = (await res.json()) as { bets?: Bet[] };
    return data.bets ?? [];
}

/** Fetch the intuition-vs-AI analytics scoreboard. */
export async function getAnalytics(
    filters?: BetFilters,
): Promise<BetAnalyticsResponse> {
    const qs = toQueryString(filters, [
        'source',
        'sport',
        'market',
        'from',
        'to',
    ]);
    const res = await fetch(`/api/admin/bets/analytics${qs}`);
    if (!res.ok) {
        throw new Error(await errorMessage(res, 'Failed to fetch analytics'));
    }
    return (await res.json()) as BetAnalyticsResponse;
}

/** Log a new bet. */
export async function createBet(body: CreateBetRequest): Promise<Bet> {
    const res = await fetch('/api/admin/bets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(await errorMessage(res, 'Failed to create bet'));
    }
    return (await res.json()) as Bet;
}

/** Edit an existing bet. */
export async function updateBet(
    id: number,
    body: UpdateBetRequest,
): Promise<Bet> {
    const res = await fetch(`/api/admin/bets/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(await errorMessage(res, 'Failed to update bet'));
    }
    return (await res.json()) as Bet;
}

/** Settle a bet outcome. */
export async function settleBet(
    id: number,
    body: SettleBetRequest,
): Promise<Bet> {
    const res = await fetch(`/api/admin/bets/${id}/settle`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(await errorMessage(res, 'Failed to settle bet'));
    }
    return (await res.json()) as Bet;
}

/** Delete a bet. */
export async function deleteBet(id: number): Promise<void> {
    const res = await fetch(`/api/admin/bets/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
        throw new Error(await errorMessage(res, 'Failed to delete bet'));
    }
}
