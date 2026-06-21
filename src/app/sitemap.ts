import type { MetadataRoute } from 'next';
import { allPhilosophies } from 'contentlayer/generated';
import { publicOnly } from '@/lib/content';

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
 * Note: we build the array directly rather than reusing `generateSitemap`
 * (src/lib/sitemap.ts) because that helper returns a raw XML string, whereas
 * App Router expects a typed object array. We still mirror its privacy model by
 * filtering philosophy posts through the same `publicOnly` helper, so the
 * `private-example` note is excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
        url: `${SITE_URL}${path}`,
    }));

    const postEntries: MetadataRoute.Sitemap = publicOnly(allPhilosophies).map(
        (post) => ({
            url: `${SITE_URL}/${post.slug}`,
            lastModified: post.date ? new Date(post.date) : undefined,
        }),
    );

    return [...staticEntries, ...postEntries];
}
