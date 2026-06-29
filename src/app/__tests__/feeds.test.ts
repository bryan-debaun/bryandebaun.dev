import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listPublishedArticles = vi.fn();
vi.mock('@/lib/services/articles', () => ({
    listPublishedArticles: () => listPublishedArticles(),
}));

const articles = [
    {
        id: 1,
        slug: 'cptsd',
        title: 'CPTSD',
        body: '# CPTSD',
        status: 'published',
        tags: [],
        publishedAt: '2026-01-29T00:00:00.000Z',
        createdAt: '2026-01-29T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
    },
];

beforeEach(() => {
    listPublishedArticles.mockReset();
    listPublishedArticles.mockResolvedValue(articles);
});

afterEach(() => {
    vi.resetModules();
});

describe('sitemap', () => {
    it('includes static routes and published article URLs from the API', async () => {
        const { default: sitemap } = await import('@/app/sitemap');
        const entries = await sitemap();
        const urls = entries.map((e) => e.url);
        expect(urls).toContain('https://bryandebaun.dev/philosophy');
        expect(urls).toContain('https://bryandebaun.dev/philosophy/cptsd');
        const cptsd = entries.find(
            (e) => e.url === 'https://bryandebaun.dev/philosophy/cptsd',
        );
        expect(cptsd?.lastModified).toEqual(
            new Date('2026-02-01T00:00:00.000Z'),
        );
    });

    it('still emits static routes when there are no articles', async () => {
        listPublishedArticles.mockResolvedValue([]);
        const { default: sitemap } = await import('@/app/sitemap');
        const entries = await sitemap();
        const urls = entries.map((e) => e.url);
        expect(urls).toContain('https://bryandebaun.dev/about');
        expect(
            urls.some((u) =>
                u.startsWith('https://bryandebaun.dev/philosophy/'),
            ),
        ).toBe(false);
    });
});

describe('rss.xml route', () => {
    it('renders published articles under the philosophy path', async () => {
        const { GET } = await import('@/app/rss.xml/route');
        const res = await GET();
        expect(res.headers.get('Content-Type')).toBe('application/xml');
        const xml = await res.text();
        expect(xml).toContain('<title>CPTSD</title>');
        expect(xml).toContain(
            '<link>https://bryandebaun.dev/philosophy/cptsd</link>',
        );
    });

    it('produces a valid empty feed when there are no articles', async () => {
        listPublishedArticles.mockResolvedValue([]);
        const { GET } = await import('@/app/rss.xml/route');
        const res = await GET();
        const xml = await res.text();
        expect(xml).toContain('<rss version="2.0">');
        expect(xml).not.toContain('<item>');
    });
});
