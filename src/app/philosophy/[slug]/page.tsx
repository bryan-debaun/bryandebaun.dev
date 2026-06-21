import type { Metadata } from 'next';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { formatDate } from '@/lib/dates';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bryandebaun.dev';

type PhilosophyDoc = {
    slug: string;
    title: string;
    summary?: string;
    ogImage?: string;
    date?: string;
    private?: boolean;
};

async function findPostBySlug(
    slug: string,
): Promise<PhilosophyDoc | undefined> {
    const { allPhilosophies } = await import(
        '../../../../.contentlayer/generated'
    );
    return allPhilosophies.find(
        (p: PhilosophyDoc) =>
            p.slug.endsWith(slug) || p.slug === `philosophy/${slug}`,
    );
}

const componentCache = new Map<string, React.ComponentType<unknown>>();
const compiledBySlug = new Map<string, React.ComponentType<unknown>>();
const compiledElementsBySlug = new Map<string, React.ReactElement>();
function getComponentFromCode(code: string) {
    if (componentCache.has(code)) return componentCache.get(code)!;
    // Provide the JSX runtime helpers (synchronously imported at module scope) into the evaluated MDX code.
    // Evaluate MDX code — result may be a component function or a module-like object.
    let Comp: unknown = new Function(
        'React',
        '_jsx_runtime',
        `${code}; return Component`,
    )(React, jsxRuntime);

    // Some MDX compilers may return a module-like object `{ default: Component, frontmatter: ... }`.
    // Normalize to the default export when present.
    type MDXModule = { default?: React.ComponentType<unknown> };
    if (
        Comp &&
        typeof Comp === 'object' &&
        typeof (Comp as MDXModule).default === 'function'
    ) {
        Comp = (Comp as MDXModule).default as React.ComponentType<unknown>;
    }

    componentCache.set(code, Comp as React.ComponentType<unknown>);
    return Comp as React.ComponentType<unknown>;
}

// Pre-compilation at module init removed — compile on-demand at request-time to
// ensure new Contentlayer documents are picked up without requiring a Next restart.
export async function generateStaticParams() {
    const { allPhilosophies } = await import(
        '../../../../.contentlayer/generated'
    );
    return allPhilosophies.map((p) => {
        const parts = p.slug.split('/');
        return { slug: parts[parts.length - 1] };
    });
}

export async function generateMetadata({
    params,
}: {
    params?: { slug: string } | Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = (await params) as { slug: string };
    const post = await findPostBySlug(slug);

    if (!post) {
        return { title: 'Note not found — Bryan DeBaun' };
    }

    const title = `${post.title} — Bryan DeBaun`;
    const description =
        post.summary ?? `${post.title} — a note by Bryan DeBaun.`;
    const url = `${SITE_URL}/${post.slug}`;

    return {
        title,
        description,
        openGraph: {
            type: 'article',
            title,
            description,
            url,
            ...(post.ogImage ? { images: [{ url: post.ogImage }] } : {}),
            ...(post.date ? { publishedTime: post.date } : {}),
        },
    };
}

export default async function PhilosophyPage({
    params,
}: {
    params?: { slug: string } | Promise<{ slug: string }>;
}) {
    const { slug } = (await params) as { slug: string };
    const { allPhilosophies } = await import(
        '../../../../.contentlayer/generated'
    );
    const post = allPhilosophies.find(
        (p) => p.slug.endsWith(slug) || p.slug === `philosophy/${slug}`,
    );

    if (!post) {
        return (
            <div className="prose prose-norwegian dark:prose-invert">
                <h2>Note not found</h2>
                <p>No note exists at this slug.</p>
            </div>
        );
    }

    let rendered = compiledElementsBySlug.get(post.slug);

    // If the content was added after module init (e.g., run-content was run
    // without a Next restart), compile and cache it at runtime so it appears
    // immediately in development.
    if (!rendered && post.body?.code) {
        try {
            const Comp = getComponentFromCode(post.body.code);
            compiledBySlug.set(post.slug, Comp);
            // Suppress MDX-rendered top-level <h1> so the page only shows the canonical title once.
            // Use a typed component type instead of `any` to satisfy lint rules.
            const CompTyped = Comp as React.ComponentType<
                Record<string, unknown>
            >;
            rendered = React.createElement(CompTyped, {
                components: { h1: () => null },
            });
            compiledElementsBySlug.set(post.slug, rendered);
        } catch {
            // Ignore compile errors — fall back to the generic "Unable to render content." message.
        }
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        ...(post.summary ? { description: post.summary } : {}),
        ...(post.date
            ? { datePublished: post.date, dateModified: post.date }
            : {}),
        ...(post.ogImage ? { image: post.ogImage } : {}),
        url: `${SITE_URL}/${post.slug}`,
        author: { '@type': 'Person', name: 'Bryan DeBaun' },
    };

    return (
        <article className="prose prose-norwegian dark:prose-invert max-w-none">
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be emitted as a raw script body; content is a serialized object, not user HTML
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <h1 className="text-center scroll-mt-[var(--header-height)]">
                {post.title}
            </h1>
            <div>{rendered ?? <div>Unable to render content.</div>}</div>
            {post.date ? (
                <p className="text-sm text-muted text-right">
                    - {formatDate(post.date, { month: 'long' })}
                </p>
            ) : null}
        </article>
    );
}
