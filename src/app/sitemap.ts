import type { MetadataRoute } from 'next';
import { listPublishedArticles } from '@/lib/services/articles';

/**
 * Base site URL. Mirrors the source used across the app (server-fetch, auth
 * routes): prefer NEXT_PUBLIC_SITE_URL, fall back to the canonical domain.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bryandebaun.dev';

// Public, top-level static routes.
const STATIC_PATHS = [
    '', // home
    '/about',
    '/projects',
    '/philosophy',
    '/media',
    '/books',
    '/authors',
    '/ratings',
];

/**
 * App Router sitemap. Next renders this `MetadataRoute.Sitemap` array to XML.
 *
 * Philosophy entries are sourced from the MCP Articles API and are inherently
 * public-only (the API returns `published` articles for unauthenticated reads),
 * so no `publicOnly` filtering is needed here anymore.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
        url: `${SITE_URL}${path}`,
    }));

    const articles = await listPublishedArticles();
    const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
        url: `${SITE_URL}/philosophy/${article.slug}`,
        lastModified: article.updatedAt
            ? new Date(article.updatedAt)
            : undefined,
    }));

    return [...staticEntries, ...articleEntries];
}
