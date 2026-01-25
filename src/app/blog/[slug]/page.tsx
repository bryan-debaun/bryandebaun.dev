import React from 'react'
import { allPosts } from 'contentlayer/generated'

// Cache compiled components to avoid recreating them during render
const componentCache = new Map<string, React.ComponentType<any>>()
function getComponentFromCode(code: string) {
  if (componentCache.has(code)) return componentCache.get(code)!
  // eslint-disable-next-line no-new-func
  const Comp = new Function('React', `${code}; return Component`)(React)
  componentCache.set(code, Comp)
  return Comp
}

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

  const MDXComponent = getComponentFromCode(post.body.code)

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