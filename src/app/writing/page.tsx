import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedArticles } from '@/lib/services/articles';
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
    const posts = await listPublishedArticles();
    return (
        <div className="prose prose-norwegian dark:prose-invert">
            <h2>Philosophy & Thoughts</h2>
            {posts.length === 0 ? (
                <p>No notes yet.</p>
            ) : (
                <ul className="list-none pl-0">
                    {posts.map((p) => (
                        <li key={p.id}>
                            <Link href={`/writing/${p.slug}`}>
                                {p.title}
                            </Link>
                            {p.summary ? (
                                <div className="text-sm">{p.summary}</div>
                            ) : null}
                            {p.publishedAt ? (
                                <div className="text-sm text-muted">
                                    {formatDate(p.publishedAt, {
                                        month: 'long',
                                    })}
                                </div>
                            ) : null}
                            {p.tags.length > 0 ? (
                                <div className="text-sm text-muted">
                                    {p.tags.join(' · ')}
                                </div>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
