import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import type {
    CreateArticleRequest,
    ListArticlesResponse,
} from '@bryandebaun/mcp-client';
import { ArticleReadStatus } from '@bryandebaun/mcp-client';
import { requireAdmin } from '@/lib/auth-guard';
import { unwrapApiResponse } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';
import {
    isSlugConflictError,
    revalidateArticlePaths,
} from '@/lib/admin-articles';

import { createApi as _createApi } from '@/lib/mcp';
export function createApi(token?: string) {
    return _createApi(token);
}

/**
 * GET /api/admin/articles
 *
 * Lists ALL articles including drafts (`status=all`). Admin-only — the draft
 * visibility comes from sending the caller's Supabase JWT to the MCP server,
 * which is what authorizes returning unpublished content.
 */
export async function GET() {
    const guard = await requireAdmin();
    if (guard) return guard;

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const api = createApi(session?.access_token);

    try {
        const res = await api.api.listArticles({
            status: ArticleReadStatus.All,
        });
        const payload = unwrapApiResponse<ListArticlesResponse>(res);
        return NextResponse.json({ articles: payload?.articles ?? [] });
    } catch (e) {
        console.error('Admin: failed to list articles', e);
        return NextResponse.json(
            { error: 'Failed to list articles' },
            { status: 502 },
        );
    }
}

/**
 * POST /api/admin/articles
 *
 * Creates a new article. A duplicate slug is surfaced as a clean 400 field
 * error so the editor can show it inline. On success we revalidate the public
 * writing paths so a freshly-published article appears without waiting out
 * the ISR window.
 */
export async function POST(req: NextRequest) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const api = createApi(session?.access_token);

    const payload = (await req.json()) as CreateArticleRequest;

    try {
        const res = await api.api.createArticle(payload);
        const created = unwrapApiResponse(res);
        revalidateArticlePaths(revalidatePath, payload.slug);
        return NextResponse.json(created, { status: 201 });
    } catch (e) {
        if (isSlugConflictError(e)) {
            return NextResponse.json(
                { fieldErrors: { slug: 'That slug is already in use.' } },
                { status: 400 },
            );
        }
        console.error('Admin: failed to create article', e);
        return NextResponse.json(
            { error: 'Failed to create article' },
            { status: 502 },
        );
    }
}
