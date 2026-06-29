import type {
    Bet,
    BetAnalyticsResponse,
    CreateBetRequest,
    SettleBetRequest,
    UpdateBetRequest,
} from '@bryandebaun/mcp-client';
import type { BetFilters } from '@/lib/bets';
import * as repo from '@/lib/repositories/betsRepository';

/**
 * Admin Bets service — the orchestration layer between the `useAdminBets` hook
 * and the {@link repo betsRepository}. Keeps UI components free of direct fetch
 * wiring and gives a single seam to mock in tests, mirroring the articles
 * service split.
 */

export function listBets(filters?: BetFilters): Promise<Bet[]> {
    return repo.listBets(filters);
}

export function getAnalytics(
    filters?: BetFilters,
): Promise<BetAnalyticsResponse> {
    return repo.getAnalytics(filters);
}

export function createBet(body: CreateBetRequest): Promise<Bet> {
    return repo.createBet(body);
}

export function updateBet(id: number, body: UpdateBetRequest): Promise<Bet> {
    return repo.updateBet(id, body);
}

export function settleBet(id: number, body: SettleBetRequest): Promise<Bet> {
    return repo.settleBet(id, body);
}

export function deleteBet(id: number): Promise<void> {
    return repo.deleteBet(id);
}
