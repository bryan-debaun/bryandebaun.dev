import { allPhilosophies } from 'contentlayer/generated';
import { generateRSS } from '@/lib/rss';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bryandebaun.dev';

/**
 * RSS feed for public philosophy posts. Delegates XML generation to
 * `generateRSS` (src/lib/rss.ts), which filters private items via `publicOnly`.
 */
export function GET(): Response {
    const items = allPhilosophies.map((post) => ({
        title: post.title,
        slug: post.slug,
        private: post.private,
    }));

    const xml = generateRSS(SITE_URL, items);

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
