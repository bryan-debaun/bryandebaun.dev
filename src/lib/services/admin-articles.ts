import type { Article } from '@bryandebaun/mcp-client';
import { ArticleReadStatus } from '@bryandebaun/mcp-client';
import { createApi } from '@/lib/mcp';
import { unwrapApiResponse } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-side fetch of a single article INCLUDING drafts, for the admin editor.
 *
 * Sends the caller's Supabase JWT (plus the gateway key, via `createApi`) so the
 * MCP server authorizes returning unpublished content — exactly the two-factor
 * path the admin write routes use. Callers must already be behind
 * `requireAdminPage()`. Returns `null` when missing or unreachable.
 */
export async function getAdminArticleBySlug(
    slug: string,
): Promise<Article | null> {
    try {
        const supabase = await createClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();
        const api = createApi(session?.access_token);
        const res = await api.api.getArticle(slug, {
            status: ArticleReadStatus.All,
        });
        return unwrapApiResponse<Article>(res) ?? null;
    } catch (e) {
        console.error(`getAdminArticleBySlug(${slug}) failed`, e);
        return null;
    }
}
