import React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'

const componentCache = new Map<string, React.ComponentType<unknown>>()
const compiledBySlug = new Map<string, React.ComponentType<unknown>>()
const compiledElementsBySlug = new Map<string, React.ReactElement>()
function getComponentFromCode(code: string) {
    if (componentCache.has(code)) return componentCache.get(code)!
    // Provide the JSX runtime helpers (synchronously imported at module scope) into the evaluated MDX code.
    let Comp = new Function('React', '_jsx_runtime', `${code}; return Component`)(React, jsxRuntime) as any
    // Some MDX compilers may return a module-like object `{ default: Component, frontmatter: ... }`.
    // Normalize to the default export when present.
    if (Comp && typeof Comp === 'object' && typeof Comp.default === 'function') {
        Comp = Comp.default
    }
    componentCache.set(code, Comp)
    return Comp
}

// Pre-compilation at module init removed — compile on-demand at request-time to
// ensure new Contentlayer documents are picked up without requiring a Next restart.
export async function generateStaticParams() {
    const { allPhilosophies } = await import('../../../../.contentlayer/generated')
    return allPhilosophies.map((p) => {
        const parts = p.slug.split('/')
        return { slug: parts[parts.length - 1] }
    })
}

export default async function PhilosophyPage({ params }: { params?: any }) {
    const { slug } = (await params) as { slug: string }
    const { allPhilosophies } = await import('../../../../.contentlayer/generated')
    const post = allPhilosophies.find((p) => p.slug.endsWith(slug) || p.slug === `philosophy/${slug}`)

    if (!post) {
        return (
            <div className="prose prose-norwegian dark:prose-invert">
                <h2>Note not found</h2>
                <p>No note exists at this slug.</p>
            </div>
        )
    }

    let rendered = compiledElementsBySlug.get(post.slug)

    // If the content was added after module init (e.g., run-content was run
    // without a Next restart), compile and cache it at runtime so it appears
    // immediately in development.
    if (!rendered && post.body?.code) {
        try {
            const Comp = getComponentFromCode(post.body.code)
            compiledBySlug.set(post.slug, Comp)
            // Suppress MDX-rendered top-level <h1> so the page only shows the canonical title once.
            rendered = React.createElement(Comp, { components: { h1: () => null } })
            compiledElementsBySlug.set(post.slug, rendered)
        } catch {
            // Ignore compile errors — fall back to the generic "Unable to render content." message.
        }
    }

    function formatDateSafe(dateValue: unknown) {
        if (!dateValue) return ''
        if (typeof dateValue === 'string') {
            // Parse YYYY-MM-DD (or YYYY-MM-DDTHH:MM:SS...) prefix to avoid timezone shifts.
            const m = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/)
            if (m) {
                const y = Number(m[1])
                const mo = Number(m[2])
                const d = Number(m[3])
                return new Date(y, mo - 1, d).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })
            }
        }
        const dt = new Date(dateValue as any)
        if (isNaN(dt.getTime())) return String(dateValue)
        return dt.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    return (
        <article className="prose prose-norwegian dark:prose-invert">
            <h1>{post.title}</h1>
            <div>
                {rendered ?? <div>Unable to render content.</div>}
            </div>
            {post.date ? <p className="text-sm text-muted text-right">- {formatDateSafe(post.date)}</p> : null}
        </article>
    )
}
