import type { Metadata } from 'next';
import Card from '@/components/Card';
import { listRecentPublishedArticles } from '@/lib/services/articles';
import { formatDate } from '@/lib/dates';

export const metadata: Metadata = {
    title: 'Philosophy & Thoughts — Bryan DeBaun',
    description:
        'Notes and reflections by Bryan DeBaun on philosophy, engineering, and the ideas that shape his thinking.',
};

// ISR: revalidate the list periodically; instant updates arrive via the
// secret-protected /api/revalidate route when an article is published.
export const revalidate = 300;

export default async function Philosophy() {
    const posts = await listRecentPublishedArticles();
    return (
        <div className="prose prose-norwegian dark:prose-invert">
            <h2>Philosophy & Thoughts</h2>
            {posts.length === 0 ? (
                <p>No notes yet.</p>
            ) : (
                <ul className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                    {posts.map((p) => (
                        <li key={p.id} className="min-w-0">
                            <Card
                                href={`/writing/${p.slug}`}
                                title={p.title}
                                description={p.summary}
                                chips={p.tags}
                                meta={
                                    p.publishedAt
                                        ? formatDate(p.publishedAt, {
                                              month: 'long',
                                          })
                                        : undefined
                                }
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
