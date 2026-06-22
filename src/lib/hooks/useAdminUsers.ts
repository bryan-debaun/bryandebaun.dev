import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminUserView } from '@/lib/admin-users';
import * as repo from '@/lib/repositories/usersRepository';

const USERS_KEY = ['admin-users'];

/**
 * TanStack Query hook powering the admin users/invites UI. Fetches the users
 * list and exposes invite-create and invite-revoke mutations that invalidate
 * the list on settle (refresh after mutation).
 */
export function useAdminUsers(initialUsers?: AdminUserView[]) {
    const qc = useQueryClient();

    const usersQuery = useQuery({
        queryKey: USERS_KEY,
        queryFn: repo.listAdminUsers,
        initialData: initialUsers,
    });

    const inviteMutation = useMutation({
        mutationFn: (email: string) => repo.createInvite(email),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: USERS_KEY });
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (id: string) => repo.revokeInvite(id),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: USERS_KEY });
        },
    });

    return {
        users: usersQuery.data ?? [],
        isLoading: usersQuery.isLoading,
        isError: usersQuery.isError,
        error: usersQuery.error as Error | null,
        refetch: usersQuery.refetch,
        inviteMutation,
        revokeMutation,
    };
}
