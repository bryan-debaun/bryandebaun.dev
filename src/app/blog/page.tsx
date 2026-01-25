import { allPosts } from 'contentlayer/generated'

export default function Blog() {
    return (
        <div className="prose">
            <h2>Blog</h2>
            {allPosts.length === 0 ? (
                <p>No posts yet.</p>
            ) : (
                <ul>
                    {allPosts.map((post) => {
                        const slugParts = post.slug.split('/')
                        const shortSlug = slugParts[slugParts.length - 1]
                        return (
                            <li key={post._id}>
                                <a href={`/blog/${shortSlug}`}>{post.title}</a>
                                {post.description ? <span> — {post.description}</span> : null}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
