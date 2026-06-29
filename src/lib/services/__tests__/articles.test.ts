import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listArticles = vi.fn();
const getArticle = vi.fn();

vi.mock('@/lib/mcp', () => ({
    createApi: () => ({ api: { listArticles, getArticle } }),
}));

// Keep the real ArticleStatus/ArticleReadStatus enums so the service's
// status comparisons behave as in production.
vi.mock('@bryandebaun/mcp-client', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@bryandebaun/mcp-client')>();
    return actual;
});

import {
    getArticleBySlug,
    listPublishedArticles,
    listRecentPublishedArticles,
} from '@/lib/services/articles';

const published = {
    id: 1,
    slug: 'cptsd',
    title: 'CPTSD',
    body: '# CPTSD\n\nBody.',
    status: 'published',
    tags: ['mental-health'],
    publishedAt: '2026-01-29T00:00:00.000Z',
    createdAt: '2026-01-29T00:00:00.000Z',
    updatedAt: '2026-01-29T00:00:00.000Z',
};

beforeEach(() => {
    listArticles.mockReset();
    getArticle.mockReset();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('listPublishedArticles', () => {
    it('requests published-only and returns the articles', async () => {
        listArticles.mockResolvedValue({
            data: { articles: [published], total: 1 },
        });
        const result = await listPublishedArticles();
        expect(listArticles).toHaveBeenCalledWith({ status: 'published' });
        expect(result).toHaveLength(1);
        expect(result[0].slug).toBe('cptsd');
    });

    it('returns an empty list when the API throws', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        listArticles.mockRejectedValue(new Error('network down'));
        const result = await listPublishedArticles();
        expect(result).toEqual([]);
    });

    it('returns an empty list when the payload is missing articles', async () => {
        listArticles.mockResolvedValue({ data: {} });
        const result = await listPublishedArticles();
        expect(result).toEqual([]);
    });
});

describe('listRecentPublishedArticles', () => {
    const make = (slug: string, publishedAt: string | null) => ({
        ...published,
        slug,
        title: slug,
        publishedAt,
    });

    it('sorts newest-first', async () => {
        listArticles.mockResolvedValue({
            data: {
                articles: [
                    make('old', '2024-01-01T00:00:00.000Z'),
                    make('new', '2026-01-01T00:00:00.000Z'),
                    make('mid', '2025-01-01T00:00:00.000Z'),
                ],
                total: 3,
            },
        });
        const result = await listRecentPublishedArticles();
        expect(result.map((a) => a.slug)).toEqual(['new', 'mid', 'old']);
    });

    it('caps the result at the limit (default 5)', async () => {
        listArticles.mockResolvedValue({
            data: {
                articles: Array.from({ length: 8 }, (_, i) =>
                    make(`a${i}`, `2026-01-0${i + 1}T00:00:00.000Z`),
                ),
                total: 8,
            },
        });
        const result = await listRecentPublishedArticles();
        expect(result).toHaveLength(5);
    });

    it('returns all when fewer than the limit', async () => {
        listArticles.mockResolvedValue({
            data: {
                articles: [
                    make('a', '2026-01-01T00:00:00.000Z'),
                    make('b', '2026-01-02T00:00:00.000Z'),
                ],
                total: 2,
            },
        });
        const result = await listRecentPublishedArticles();
        expect(result).toHaveLength(2);
    });

    it('sorts articles without publishedAt last', async () => {
        listArticles.mockResolvedValue({
            data: {
                articles: [
                    make('no-date', null),
                    make('dated', '2026-01-01T00:00:00.000Z'),
                ],
                total: 2,
            },
        });
        const result = await listRecentPublishedArticles();
        expect(result.map((a) => a.slug)).toEqual(['dated', 'no-date']);
    });
});

describe('getArticleBySlug', () => {
    it('returns a published article', async () => {
        getArticle.mockResolvedValue({ data: published });
        const result = await getArticleBySlug('cptsd');
        expect(getArticle).toHaveBeenCalledWith('cptsd', {
            status: 'published',
        });
        expect(result?.slug).toBe('cptsd');
    });

    it('returns null for a non-published article (defensive)', async () => {
        getArticle.mockResolvedValue({
            data: { ...published, status: 'draft' },
        });
        const result = await getArticleBySlug('cptsd');
        expect(result).toBeNull();
    });

    it('returns null when the API throws (e.g. 404)', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        getArticle.mockRejectedValue(new Error('not found'));
        const result = await getArticleBySlug('missing');
        expect(result).toBeNull();
    });
});
