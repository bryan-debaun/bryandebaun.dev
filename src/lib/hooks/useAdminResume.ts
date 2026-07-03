import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Resume } from '@/lib/resume';
import * as repo from '@/lib/repositories/resumeRepository';

const RESUME_KEY = ['admin-resume'];

/**
 * TanStack Query hook powering the admin résumé editor. Fetches the full résumé
 * (incl. private contact) and exposes an update mutation that refreshes the
 * cached copy on success. Mirrors {@link useAdminArticles}.
 */
export function useAdminResume(initialResume?: Resume) {
    const qc = useQueryClient();

    const resumeQuery = useQuery({
        queryKey: RESUME_KEY,
        queryFn: repo.getAdminResume,
        initialData: initialResume,
    });

    const updateMutation = useMutation({
        mutationFn: (doc: Resume) => repo.updateResume(doc),
        onSuccess: (updated) => {
            qc.setQueryData(RESUME_KEY, updated);
        },
    });

    return {
        resume: resumeQuery.data,
        isLoading: resumeQuery.isLoading,
        isError: resumeQuery.isError,
        error: resumeQuery.error as Error | null,
        refetch: resumeQuery.refetch,
        updateMutation,
    };
}
