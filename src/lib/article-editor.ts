import type {
    Article,
    CreateArticleRequest,
    UpdateArticleRequest,
} from '@bryandebaun/mcp-client';
import { ArticleStatus } from '@bryandebaun/mcp-client';

/** Editable form fields for an article. */
export interface ArticleFormValues {
    title: string;
    slug: string;
    summary: string;
    tags: string[];
    body: string;
}

/** A blank form for the "new article" flow. */
export function emptyArticleForm(): ArticleFormValues {
    return { title: '', slug: '', summary: '', tags: [], body: '' };
}

/** Populate the form from an existing article (for editing). */
export function formFromArticle(article: Article): ArticleFormValues {
    return {
        title: article.title,
        slug: article.slug,
        summary: article.summary ?? '',
        tags: article.tags ?? [],
        body: article.body,
    };
}

export interface FormValidationResult {
    ok: boolean;
    errors: Partial<Record<'title' | 'slug' | 'body', string>>;
}

/** Required-field validation surfaced inline in the editor before submit. */
export function validateArticleForm(
    values: ArticleFormValues,
): FormValidationResult {
    const errors: FormValidationResult['errors'] = {};
    if (!values.title.trim()) errors.title = 'Title is required.';
    if (!values.slug.trim()) errors.slug = 'Slug is required.';
    if (!values.body.trim()) errors.body = 'Body is required.';
    return { ok: Object.keys(errors).length === 0, errors };
}

/** Build the create payload for a new article at the given target status. */
export function toCreateRequest(
    values: ArticleFormValues,
    status: ArticleStatus,
): CreateArticleRequest {
    const summary = values.summary.trim();
    return {
        slug: values.slug.trim(),
        title: values.title.trim(),
        body: values.body,
        ...(summary ? { summary } : {}),
        status,
        tags: values.tags,
        ...(status === ArticleStatus.Published
            ? { publishedAt: new Date().toISOString() }
            : {}),
    };
}

/**
 * Build the update payload for an existing article.
 *
 * `targetStatus` drives the draft/publish transition:
 *  - publishing a previously-unpublished article stamps `publishedAt` only when
 *    it was not already set (so re-publishing preserves the original date);
 *  - unpublishing flips `status` back to draft and leaves `publishedAt` intact.
 *
 * A slug rename is sent via `newSlug`.
 */
export function toUpdateRequest(
    values: ArticleFormValues,
    original: Article,
    targetStatus: ArticleStatus,
): UpdateArticleRequest {
    const summary = values.summary.trim();
    const nextSlug = values.slug.trim();

    const payload: UpdateArticleRequest = {
        title: values.title.trim(),
        body: values.body,
        summary,
        status: targetStatus,
        tags: values.tags,
    };

    if (nextSlug !== original.slug) {
        payload.newSlug = nextSlug;
    }

    if (
        targetStatus === ArticleStatus.Published &&
        !original.publishedAt
    ) {
        payload.publishedAt = new Date().toISOString();
    }

    return payload;
}
