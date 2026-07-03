import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    ListResumeDownloadRequestsResponse,
    ResumeDownloadReadStatus,
} from '@bryandebaun/mcp-client';
import * as repo from '@/lib/repositories/resumeRequestsRepository';

const RESUME_REQUESTS_KEY = ['admin-resume-requests'];

/**
 * TanStack Query hook powering the admin résumé-requests UI (ADR 0007 Phase 2).
 * Fetches the requests list (optionally filtered by status) and exposes
 * approve/deny mutations that invalidate the list on settle so the table
 * refreshes after an action.
 */
export function useAdminResumeRequests(
    status?: ResumeDownloadReadStatus,
    initialData?: ListResumeDownloadRequestsResponse,
) {
    const qc = useQueryClient();
    const queryKey = [...RESUME_REQUESTS_KEY, status ?? 'all'];

    const requestsQuery = useQuery({
        queryKey,
        queryFn: () => repo.listResumeRequests(status),
        initialData,
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note?: string }) =>
            repo.approveResumeRequest(id, note),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: RESUME_REQUESTS_KEY });
        },
    });

    const denyMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note?: string }) =>
            repo.denyResumeRequest(id, note),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: RESUME_REQUESTS_KEY });
        },
    });

    return {
        requests: requestsQuery.data?.requests ?? [],
        total: requestsQuery.data?.total ?? 0,
        isLoading: requestsQuery.isLoading,
        isError: requestsQuery.isError,
        error: requestsQuery.error as Error | null,
        refetch: requestsQuery.refetch,
        approveMutation,
        denyMutation,
    };
}
