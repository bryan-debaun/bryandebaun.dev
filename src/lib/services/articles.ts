import type { Article, ListArticlesResponse } from '@bryandebaun/mcp-client';
import { ArticleReadStatus, ArticleStatus } from '@bryandebaun/mcp-client';
import { createApi } from '@/lib/mcp';
import { unwrapApiResponse } from '@/lib/api-response';
import { looksLikeHtmlPayload } from '@/lib/mcp-proxy';

export type { Article } from '@bryandebaun/mcp-client';

/**
 * List published articles from the MCP Articles API.
 *
 * Public reads MUST request `published` only — drafts require an admin JWT and
 * must never be exposed on public pages, the sitemap, or the RSS feed.
 *
 * Mirrors the books/authors services: graceful failure (returns an empty list)
 * if the API is unreachable, so the build (ISR) and pages never hard-crash.
 */
export async function listPublishedArticles(): Promise<Article[]> {
    try {
        const api = createApi();
        const res = await api.api.listArticles({
            status: ArticleReadStatus.Published,
        });
        const payload = unwrapApiResponse<ListArticlesResponse>(res);

        if (await looksLikeHtmlPayload(payload)) {
            console.error(
                'listPublishedArticles: detected HTML payload from MCP; returning empty list',
            );
            return [];
        }

        return payload?.articles ?? [];
    } catch (e) {
        console.error('listPublishedArticles failed; returning empty list', e);
        return [];
    }
}

/**
 * Fetch a single published article by slug. Returns `null` when the article is
 * missing, not published, or the API is unreachable — callers should render a
 * not-found state in that case.
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
    try {
        const api = createApi();
        const res = await api.api.getArticle(slug, {
            status: ArticleReadStatus.Published,
        });
        const payload = unwrapApiResponse<Article>(res);

        if (await looksLikeHtmlPayload(payload)) {
            console.error(
                `getArticleBySlug(${slug}): detected HTML payload from MCP; returning null`,
            );
            return null;
        }

        // Defensive: never surface a non-published article on the public path,
        // even if an upstream bug returned one.
        if (payload?.status !== ArticleStatus.Published) {
            return null;
        }

        return payload;
    } catch (e) {
        console.error(`getArticleBySlug(${slug}) failed; returning null`, e);
        return null;
    }
}
