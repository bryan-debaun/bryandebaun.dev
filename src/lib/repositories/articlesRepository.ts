import type {
    Article,
    CreateArticleRequest,
    UpdateArticleRequest,
} from '@bryandebaun/mcp-client';

/**
 * Client-side repository for admin article operations. Talks to the admin API
 * routes (which enforce auth + send the Supabase JWT and MCP gateway key to the
 * MCP server). Never calls the MCP server directly — that would leak secrets to
 * the browser.
 */

/**
 * Error carrying per-field validation messages from the admin API (e.g. the
 * `slug already exists` 400). The editor surfaces these inline.
 */
export class ArticleFieldError extends Error {
    readonly fieldErrors: Record<string, string>;
    constructor(fieldErrors: Record<string, string>) {
        super('Validation failed');
        this.name = 'ArticleFieldError';
        this.fieldErrors = fieldErrors;
    }
}

async function parseFieldError(res: Response): Promise<never> {
    const data = (await res.json().catch(() => null)) as {
        fieldErrors?: Record<string, string>;
        error?: string;
    } | null;
    if (data?.fieldErrors) {
        throw new ArticleFieldError(data.fieldErrors);
    }
    throw new Error(data?.error ?? `Request failed: ${res.status}`);
}

/** Fetch all articles including drafts (admin-only). */
export async function listAdminArticles(): Promise<Article[]> {
    const res = await fetch('/api/admin/articles');
    if (!res.ok) {
        throw new Error(`Failed to fetch articles: ${res.status}`);
    }
    const data = (await res.json()) as { articles: Article[] };
    return data.articles ?? [];
}

/** Create a new article. Throws {@link ArticleFieldError} on a slug conflict. */
export async function createArticle(
    data: CreateArticleRequest,
): Promise<Article> {
    const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        return parseFieldError(res);
    }
    return (await res.json()) as Article;
}

/** Update an article by slug. Throws {@link ArticleFieldError} on a slug conflict. */
export async function updateArticle(
    slug: string,
    data: UpdateArticleRequest,
): Promise<Article> {
    const res = await fetch(`/api/admin/articles/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        return parseFieldError(res);
    }
    return (await res.json()) as Article;
}

/** Delete an article by slug. */
export async function deleteArticle(slug: string): Promise<void> {
    const res = await fetch(`/api/admin/articles/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
    });
    if (!res.ok && res.status !== 204) {
        const data = (await res.json().catch(() => null)) as {
            error?: string;
        } | null;
        throw new Error(
            data?.error ?? `Failed to delete article: ${res.status}`,
        );
    }
}
