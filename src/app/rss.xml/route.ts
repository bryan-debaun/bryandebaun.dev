import { listPublishedArticles } from '@/lib/services/articles';
import { generateRSS } from '@/lib/rss';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bryandebaun.dev';

// ISR: refresh the feed on the same cadence as the philosophy pages.
export const revalidate = 300;

/**
 * RSS feed for published philosophy articles, sourced from the MCP Articles
 * API. The API returns only `published` articles for unauthenticated reads, so
 * no private filtering is required.
 */
export async function GET(): Promise<Response> {
    const articles = await listPublishedArticles();
    const items = articles.map((article) => ({
        title: article.title,
        slug: `philosophy/${article.slug}`,
    }));

    const xml = generateRSS(SITE_URL, items);

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
