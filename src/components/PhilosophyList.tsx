import Link from 'next/link';
import { listPublishedArticles } from '@/lib/services/articles';

export default async function PhilosophyList({
    limit = 5,
}: {
    limit?: number;
}) {
    const posts = (await listPublishedArticles()).slice(0, limit);
    if (posts.length === 0) return null;
    return (
        <section>
            <h3>Thoughts & Philosophy</h3>
            <ul className="list-none pl-0">
                {posts.map((p) => (
                    <li key={p.id}>
                        <Link href={`/writing/${p.slug}`}>{p.title}</Link>
                        {p.summary ? (
                            <div className="text-sm">{p.summary}</div>
                        ) : null}
                    </li>
                ))}
            </ul>
        </section>
    );
}
