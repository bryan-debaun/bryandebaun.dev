import React from 'react'
import { allPosts } from 'contentlayer/generated'

export async function generateStaticParams() {
  return allPosts.map((p) => {
    const parts = p.slug.split('/')
    return { slug: parts[parts.length - 1] }
  })
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const post = allPosts.find((p) => p.slug.endsWith(slug) || p.slug === `posts/${slug}`)

  if (!post) {
    return (
      <div className="prose">
        <h2>Post not found</h2>
        <p>No post exists at this slug.</p>
      </div>
    )
  }

  // Create a React component from the compiled code in `post.body.code`.
  // Safe to execute on the server during SSG; we avoid client-side eval.
  // The compiled code returns a `Component` as the default export.
  // eslint-disable-next-line no-new-func
  const MDXComponent = new Function('React', `${post.body.code}; return Component`)(React)

  return (
    <article className="prose">
      <h1>{post.title}</h1>
      {post.date ? <p className="text-sm text-muted">{String(post.date)}</p> : null}
      <div>
        {/* Render the compiled MDX component */}
        <MDXComponent />
      </div>
    </article>
  )
}