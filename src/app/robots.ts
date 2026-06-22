import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bryandebaun.dev';

/**
 * App Router robots.txt. Allows crawling and advertises the sitemap. Base URL
 * mirrors the rest of the app (NEXT_PUBLIC_SITE_URL with a canonical fallback).
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
