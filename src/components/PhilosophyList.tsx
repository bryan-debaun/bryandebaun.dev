import Link from 'next/link';
import { allPhilosophies } from 'contentlayer/generated';
import { publicOnly } from '@/lib/content';

export default function PhilosophyList({ limit = 5 }: { limit?: number }) {
    const posts = publicOnly(allPhilosophies).slice(0, limit);
    if (posts.length === 0) return null;
    return (
        <section>
            <h3>Thoughts & Philosophy</h3>
            <ul className="list-none pl-0">
                {posts.map((p) => {
                    const slugParts = p.slug.split('/');
                    const shortSlug = slugParts[slugParts.length - 1];
                    return (
                        <li key={p._id}>
                            <Link href={`/philosophy/${shortSlug}`}>{p.title}</Link>
                            {p.summary ? <div className="text-sm">{p.summary}</div> : null}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
