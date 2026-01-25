import React from 'react'
import { allPosts } from 'contentlayer/generated'

// Cache compiled components to avoid recreating them during render
const componentCache = new Map<string, React.ComponentType<unknown>>()
function getComponentFromCode(code: string) {
    if (componentCache.has(code)) return componentCache.get(code)!
    // Create the component once and cache it (server-side only)
    // eslint-disable-next-line no-new-func
    const Comp = new Function('React', `${code}; return Component`)(React) as React.ComponentType<unknown>
    componentCache.set(code, Comp)
    return Comp
}

// Precompile components for all known posts so components are declared outside render
for (const p of allPosts) {
    try {
        getComponentFromCode(p.body.code)
    } catch (err) {
        // ignore compile errors at module init time
    }
}

// Render a compiled MDX component — declared outside of the page component to satisfy eslint
/* eslint-disable react-hooks/static-components */
function RenderCompiledMDX({ code }: { code: string }) {
    const Comp = componentCache.get(code)
    if (!Comp) {
        // Fall back to a simple notice if compilation failed earlier
        return <div>Unable to render post content.</div>
    }
    return <Comp />
}
/* eslint-enable react-hooks/static-components */

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

    return (
        <article className="prose">
            <h1>{post.title}</h1>
            {post.date ? <p className="text-sm text-muted">{String(post.date)}</p> : null}
            <div>
                {/* Render the compiled MDX component using `RenderCompiledMDX` (declared outside render) */}
                <RenderCompiledMDX code={post.body.code} />
            </div>
        </article>
    )
}