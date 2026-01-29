import React from 'react'
import { allPhilosophies } from 'contentlayer/generated'

const componentCache = new Map<string, React.ComponentType<unknown>>()
const compiledBySlug = new Map<string, React.ComponentType<unknown>>()
const compiledElementsBySlug = new Map<string, React.ReactElement>()
function getComponentFromCode(code: string) {
    if (componentCache.has(code)) return componentCache.get(code)!
    const Comp = new Function('React', `${code}; return Component`)(React) as React.ComponentType<unknown>
    componentCache.set(code, Comp)
    return Comp
}

for (const p of allPhilosophies) {
    try {
        const Comp = getComponentFromCode(p.body.code)
        compiledBySlug.set(p.slug, Comp)
        // Create a pre-rendered element at module init so we don't create components during render.
        compiledElementsBySlug.set(p.slug, React.createElement(Comp))
    } catch {
        // ignore compile errors
    }
}


export async function generateStaticParams() {
    return allPhilosophies.map((p) => {
        const parts = p.slug.split('/')
        return { slug: parts[parts.length - 1] }
    })
}

export default function PhilosophyPage({ params }: { params: { slug: string } }) {
    const slug = params.slug
    const post = allPhilosophies.find((p) => p.slug.endsWith(slug) || p.slug === `philosophy/${slug}`)

    if (!post) {
        return (
            <div className="prose prose-norwegian dark:prose-invert">
                <h2>Note not found</h2>
                <p>No note exists at this slug.</p>
            </div>
        )
    }

    const rendered = compiledElementsBySlug.get(post.slug)

    return (
        <article className="prose prose-norwegian dark:prose-invert">
            <h1>{post.title}</h1>
            {post.date ? <p className="text-sm text-muted">{String(post.date)}</p> : null}
            <div>
                {rendered ?? <div>Unable to render content.</div>}
            </div>
        </article>
    )
}
