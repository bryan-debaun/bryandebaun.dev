import Link from 'next/link'
import { allPhilosophies } from 'contentlayer/generated'
import { publicOnly } from '@/lib/content'

export default function Philosophy() {
    const posts = publicOnly(allPhilosophies)
    return (
        <div className="prose prose-norwegian dark:prose-invert">
            <h2>Philosophy & Thoughts</h2>
            {posts.length === 0 ? (
                <p>No notes yet.</p>
            ) : (
                <ul className="list-none pl-0">
                    {posts.map((p) => {
                        const slugParts = p.slug.split('/')
                        const shortSlug = slugParts[slugParts.length - 1]
                        return (
                            <li key={p._id}>
                                <Link href={`/philosophy/${shortSlug}`}>{p.title}</Link>
                                {p.summary ? <div className="text-sm">{p.summary}</div> : null}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
