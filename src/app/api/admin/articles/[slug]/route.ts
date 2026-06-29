import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { UpdateArticleRequest } from '@bryandebaun/mcp-client';
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

type RouteContext = {
    params: { slug: string } | Promise<{ slug: string }>;
};

/**
 * PUT /api/admin/articles/[slug]
 *
 * Updates an article (title/body/summary/tags, `status` transitions such as
 * publish/unpublish, `publishedAt`, and `newSlug` renames). On success the
 * public writing paths are revalidated — both the old and the new slug when
 * a rename occurs — so publish/unpublish is reflected immediately.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const params = await context.params;
    const slug = params.slug;
    const api = createApi(session?.access_token);

    const payload = (await req.json()) as UpdateArticleRequest;

    try {
        const res = await api.api.updateArticle(slug, payload);
        const updated = unwrapApiResponse(res);
        revalidateArticlePaths(revalidatePath, payload.newSlug ?? slug, slug);
        return NextResponse.json(updated);
    } catch (e) {
        if (isSlugConflictError(e)) {
            return NextResponse.json(
                { fieldErrors: { slug: 'That slug is already in use.' } },
                { status: 400 },
            );
        }
        console.error('Admin: failed to update article', e);
        return NextResponse.json(
            { error: 'Failed to update article' },
            { status: 502 },
        );
    }
}

/**
 * DELETE /api/admin/articles/[slug]
 *
 * Deletes an article and revalidates the public writing paths so the
 * removed article disappears from the index and 404s on its slug page.
 */
export async function DELETE(_req: NextRequest, context: RouteContext) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const supabase = await createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const params = await context.params;
    const slug = params.slug;
    const api = createApi(session?.access_token);

    try {
        await api.api.deleteArticle(slug);
        revalidateArticlePaths(revalidatePath, slug);
        return new NextResponse(null, { status: 204 });
    } catch (e) {
        console.error('Admin: failed to delete article', e);
        return NextResponse.json(
            { error: 'Failed to delete article' },
            { status: 502 },
        );
    }
}
