import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Article } from '@bryandebaun/mcp-client';
import { ArticleStatus } from '@bryandebaun/mcp-client';
import {
    emptyArticleForm,
    formFromArticle,
    toCreateRequest,
    toUpdateRequest,
    validateArticleForm,
    type ArticleFormValues,
} from '@/lib/article-editor';
import { slugify } from '@/lib/slug';

const baseArticle: Article = {
    id: 1,
    slug: 'cptsd',
    title: 'CPTSD',
    summary: 'A note',
    body: '# Body',
    status: ArticleStatus.Draft,
    tags: ['mental-health'],
    publishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

function validForm(overrides: Partial<ArticleFormValues> = {}): ArticleFormValues {
    return {
        title: 'My Title',
        slug: 'my-title',
        summary: 'Sum',
        tags: ['a'],
        body: 'Hello',
        ...overrides,
    };
}

describe('slugify', () => {
    it('lowercases, strips punctuation, and collapses spaces to hyphens', () => {
        expect(slugify('Hello, World!')).toBe('hello-world');
        expect(slugify('  Trim   Me  ')).toBe('trim-me');
        expect(slugify('Café Déjà')).toBe('cafe-deja');
    });
});

describe('validateArticleForm', () => {
    it('passes a complete form', () => {
        expect(validateArticleForm(validForm()).ok).toBe(true);
    });

    it('flags missing required fields', () => {
        const res = validateArticleForm(
            validForm({ title: '  ', slug: '', body: '' }),
        );
        expect(res.ok).toBe(false);
        expect(res.errors.title).toBeTruthy();
        expect(res.errors.slug).toBeTruthy();
        expect(res.errors.body).toBeTruthy();
    });
});

describe('form helpers', () => {
    it('emptyArticleForm is blank', () => {
        expect(emptyArticleForm()).toEqual({
            title: '',
            slug: '',
            summary: '',
            tags: [],
            body: '',
        });
    });

    it('formFromArticle maps an article including null summary', () => {
        const form = formFromArticle({ ...baseArticle, summary: null });
        expect(form.summary).toBe('');
        expect(form.tags).toEqual(['mental-health']);
        expect(form.slug).toBe('cptsd');
    });
});

describe('toCreateRequest', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-28T12:00:00.000Z'));
    });
    afterEach(() => vi.useRealTimers());

    it('omits publishedAt for a draft', () => {
        const req = toCreateRequest(validForm(), ArticleStatus.Draft);
        expect(req.status).toBe(ArticleStatus.Draft);
        expect(req.publishedAt).toBeUndefined();
    });

    it('stamps publishedAt when publishing', () => {
        const req = toCreateRequest(validForm(), ArticleStatus.Published);
        expect(req.status).toBe(ArticleStatus.Published);
        expect(req.publishedAt).toBe('2026-06-28T12:00:00.000Z');
    });

    it('drops an empty summary', () => {
        const req = toCreateRequest(
            validForm({ summary: '   ' }),
            ArticleStatus.Draft,
        );
        expect(req.summary).toBeUndefined();
    });
});

describe('toUpdateRequest', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-28T12:00:00.000Z'));
    });
    afterEach(() => vi.useRealTimers());

    it('sends newSlug only when the slug changed', () => {
        const same = toUpdateRequest(
            validForm({ slug: 'cptsd' }),
            baseArticle,
            ArticleStatus.Draft,
        );
        expect(same.newSlug).toBeUndefined();

        const renamed = toUpdateRequest(
            validForm({ slug: 'new-slug' }),
            baseArticle,
            ArticleStatus.Draft,
        );
        expect(renamed.newSlug).toBe('new-slug');
    });

    it('stamps publishedAt when publishing a never-published article', () => {
        const req = toUpdateRequest(
            validForm(),
            { ...baseArticle, publishedAt: null },
            ArticleStatus.Published,
        );
        expect(req.publishedAt).toBe('2026-06-28T12:00:00.000Z');
    });

    it('preserves the original publishedAt when re-publishing', () => {
        const req = toUpdateRequest(
            validForm(),
            { ...baseArticle, publishedAt: '2025-01-01T00:00:00.000Z' },
            ArticleStatus.Published,
        );
        expect(req.publishedAt).toBeUndefined();
    });

    it('flips status to draft when unpublishing without touching publishedAt', () => {
        const req = toUpdateRequest(
            validForm(),
            {
                ...baseArticle,
                status: ArticleStatus.Published,
                publishedAt: '2025-01-01T00:00:00.000Z',
            },
            ArticleStatus.Draft,
        );
        expect(req.status).toBe(ArticleStatus.Draft);
        expect(req.publishedAt).toBeUndefined();
    });
});
