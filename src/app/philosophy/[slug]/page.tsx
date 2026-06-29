import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleBody from '@/components/ArticleBody';
import {
    getArticleBySlug,
    listPublishedArticles,
} from '@/lib/services/articles';
import { formatDate } from '@/lib/dates';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bryandebaun.dev';

// ISR: keep article pages fresh; publishing triggers an instant update via the
// secret-protected /api/revalidate route.
export const revalidate = 300;

type PageParams = { slug: string };

/**
 * Pre-render published article slugs at build time. Derived from the API so
 * only published articles are statically generated; new/updated articles are
 * still reachable via ISR (`dynamicParams` defaults to true). A build-time API
 * outage simply yields no static params — pages remain reachable on demand.
 */
export async function generateStaticParams(): Promise<PageParams[]> {
    const articles = await listPublishedArticles();
    return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<PageParams>;
}): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        return { title: 'Note not found — Bryan DeBaun' };
    }

    const title = `${article.title} — Bryan DeBaun`;
    const description =
        article.summary ?? `${article.title} — a note by Bryan DeBaun.`;
    const url = `${SITE_URL}/philosophy/${article.slug}`;

    return {
        title,
        description,
        openGraph: {
            type: 'article',
            title,
            description,
            url,
            ...(article.publishedAt
                ? { publishedTime: article.publishedAt }
                : {}),
        },
    };
}

export default async function PhilosophyPage({
    params,
}: {
    params: Promise<PageParams>;
}) {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    const url = `${SITE_URL}/philosophy/${article.slug}`;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        ...(article.summary ? { description: article.summary } : {}),
        ...(article.publishedAt
            ? {
                  datePublished: article.publishedAt,
                  dateModified: article.updatedAt,
              }
            : {}),
        url,
        author: { '@type': 'Person', name: 'Bryan DeBaun' },
    };

    return (
        <article className="prose prose-norwegian dark:prose-invert max-w-none">
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be emitted as a raw script body; content is a serialized object, not user HTML
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <h1 className="text-center scroll-mt-[var(--header-height)]">
                {article.title}
            </h1>
            <ArticleBody body={article.body} />
            {article.publishedAt ? (
                <p className="text-sm text-muted text-right">
                    - {formatDate(article.publishedAt, { month: 'long' })}
                </p>
            ) : null}
        </article>
    );
}
