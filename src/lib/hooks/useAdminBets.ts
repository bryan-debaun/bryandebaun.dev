import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    CreateBetRequest,
    SettleBetRequest,
    UpdateBetRequest,
} from '@bryandebaun/mcp-client';
import type { BetFilters } from '@/lib/bets';
import * as service from '@/lib/services/admin-bets';

const BETS_KEY = ['admin-bets'];
const ANALYTICS_KEY = ['admin-bets-analytics'];

/**
 * TanStack Query hook powering the admin Bets dashboard. Drives both the
 * filtered bet log and the intuition-vs-AI analytics from the same `filters`,
 * and exposes create/update/settle/delete mutations that invalidate both
 * queries on settle so the table and scoreboard stay in sync.
 */
export function useAdminBets(filters: BetFilters) {
    const qc = useQueryClient();

    const betsQuery = useQuery({
        queryKey: [...BETS_KEY, filters],
        queryFn: () => service.listBets(filters),
    });

    const analyticsQuery = useQuery({
        queryKey: [...ANALYTICS_KEY, filters],
        queryFn: () => service.getAnalytics(filters),
    });

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: BETS_KEY });
        qc.invalidateQueries({ queryKey: ANALYTICS_KEY });
    };

    const createMutation = useMutation({
        mutationFn: (body: CreateBetRequest) => service.createBet(body),
        onSettled: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateBetRequest }) =>
            service.updateBet(id, body),
        onSettled: invalidate,
    });

    const settleMutation = useMutation({
        mutationFn: ({ id, body }: { id: number; body: SettleBetRequest }) =>
            service.settleBet(id, body),
        onSettled: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => service.deleteBet(id),
        onSettled: invalidate,
    });

    return {
        bets: betsQuery.data ?? [],
        betsLoading: betsQuery.isLoading,
        betsError: betsQuery.error as Error | null,
        analytics: analyticsQuery.data ?? null,
        analyticsLoading: analyticsQuery.isLoading,
        analyticsError: analyticsQuery.error as Error | null,
        createMutation,
        updateMutation,
        settleMutation,
        deleteMutation,
    };
}
