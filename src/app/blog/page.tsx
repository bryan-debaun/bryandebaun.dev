import { allPosts } from 'contentlayer/generated'
import { publicOnly } from '@/lib/content'

export default function Blog() {
    const posts = publicOnly(allPosts)

    return (
        <div className="prose prose-norwegian dark:prose-invert">
            <h2>Blog</h2>
            {posts.length === 0 ? (
                <p>No posts yet.</p>
            ) : (
                <ul>
                    {posts.map((post) => {
                        const slugParts = post.slug.split('/')
                        const shortSlug = slugParts[slugParts.length - 1]
                        return (
                            <li key={post._id}>
                                <a href={`/blog/${shortSlug}`}>{post.title}</a>
                                {post.summary ? <span> — {post.summary}</span> : null}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
