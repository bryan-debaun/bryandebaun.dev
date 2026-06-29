import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    Article,
    CreateArticleRequest,
    UpdateArticleRequest,
} from '@bryandebaun/mcp-client';
import * as repo from '@/lib/repositories/articlesRepository';

const ARTICLES_KEY = ['admin-articles'];

/**
 * TanStack Query hook powering the admin articles UI. Fetches all articles
 * (incl. drafts) and exposes create/update/delete mutations that invalidate the
 * list on settle so it refreshes after a mutation.
 */
export function useAdminArticles(initialArticles?: Article[]) {
    const qc = useQueryClient();

    const articlesQuery = useQuery({
        queryKey: ARTICLES_KEY,
        queryFn: repo.listAdminArticles,
        initialData: initialArticles,
    });

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ARTICLES_KEY });
    };

    const createMutation = useMutation({
        mutationFn: (data: CreateArticleRequest) => repo.createArticle(data),
        onSettled: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({
            slug,
            data,
        }: {
            slug: string;
            data: UpdateArticleRequest;
        }) => repo.updateArticle(slug, data),
        onSettled: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: (slug: string) => repo.deleteArticle(slug),
        onSettled: invalidate,
    });

    return {
        articles: articlesQuery.data ?? [],
        isLoading: articlesQuery.isLoading,
        isError: articlesQuery.isError,
        error: articlesQuery.error as Error | null,
        refetch: articlesQuery.refetch,
        createMutation,
        updateMutation,
        deleteMutation,
    };
}
