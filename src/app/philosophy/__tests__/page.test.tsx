import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const listPublishedArticles = vi.fn();
const getArticleBySlug = vi.fn();
vi.mock('@/lib/services/articles', () => ({
    listPublishedArticles: () => listPublishedArticles(),
    getArticleBySlug: (slug: string) => getArticleBySlug(slug),
}));

const notFound = vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({
    notFound: () => notFound(),
}));

const article = {
    id: 1,
    slug: 'cptsd',
    title: 'CPTSD — Thoughts',
    summary: 'A living document.',
    body: '# CPTSD — Thoughts\n\nThe body paragraph.',
    status: 'published',
    tags: ['mental-health'],
    publishedAt: '2026-01-29T00:00:00.000Z',
    createdAt: '2026-01-29T00:00:00.000Z',
    updatedAt: '2026-01-29T00:00:00.000Z',
};

beforeEach(() => {
    listPublishedArticles.mockReset();
    getArticleBySlug.mockReset();
    notFound.mockClear();
});

afterEach(() => {
    vi.resetModules();
});

describe('Philosophy list page', () => {
    it('renders a published article link and summary', async () => {
        listPublishedArticles.mockResolvedValue([article]);
        const { default: Philosophy } = await import('../page');
        render(await Philosophy());
        const link = screen.getByRole('link', { name: 'CPTSD — Thoughts' });
        expect(link).toHaveAttribute('href', '/philosophy/cptsd');
        expect(screen.getByText('A living document.')).toBeInTheDocument();
    });

    it('shows an empty state when there are no articles', async () => {
        listPublishedArticles.mockResolvedValue([]);
        const { default: Philosophy } = await import('../page');
        render(await Philosophy());
        expect(screen.getByText('No notes yet.')).toBeInTheDocument();
    });
});

describe('Philosophy detail page', () => {
    it('renders the title once and the article body', async () => {
        getArticleBySlug.mockResolvedValue(article);
        const { default: PhilosophyPage } = await import('../[slug]/page');
        render(
            await PhilosophyPage({
                params: Promise.resolve({ slug: 'cptsd' }),
            }),
        );

        // Page renders its own canonical <h1>; the duplicate leading H1 in the
        // body is stripped by ArticleBody, so there is exactly one h1.
        const headings = screen.getAllByRole('heading', { level: 1 });
        expect(headings).toHaveLength(1);
        expect(headings[0]).toHaveTextContent('CPTSD — Thoughts');
        expect(screen.getByText('The body paragraph.')).toBeInTheDocument();
    });

    it('calls notFound() when the article is missing', async () => {
        getArticleBySlug.mockResolvedValue(null);
        const { default: PhilosophyPage } = await import('../[slug]/page');
        await expect(
            PhilosophyPage({ params: Promise.resolve({ slug: 'missing' }) }),
        ).rejects.toThrow('NEXT_NOT_FOUND');
        expect(notFound).toHaveBeenCalled();
    });
});
