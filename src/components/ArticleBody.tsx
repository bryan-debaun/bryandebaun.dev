import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

/**
 * Remove a single leading top-level `# H1` from the Markdown body.
 *
 * The page renders the article title in its own canonical `<h1>`, and some
 * seeded bodies (e.g. the CPTSD article) begin with an `# H1` that duplicates
 * that title. Stripping only the *first* leading H1 keeps the rest of the
 * document intact (including any later `#` headings, which are unusual but
 * preserved). Setext-style underlined H1s (`Title\n=====`) are also handled.
 */
export function stripLeadingH1(markdown: string): string {
    const src = markdown.replace(/^﻿/u, '');
    // Skip any leading blank lines.
    const leadingBlank = /^(?:[ \t]*\r?\n)*/u.exec(src);
    const offset = leadingBlank ? leadingBlank[0].length : 0;
    const rest = src.slice(offset);

    // ATX heading: `# Title` (optionally with a trailing `#` sequence).
    const atx = /^#[ \t]+.*(?:\r?\n|$)/u.exec(rest);
    if (atx) {
        return rest.slice(atx[0].length).replace(/^(?:[ \t]*\r?\n)+/u, '');
    }

    // Setext heading: a line of text immediately followed by a line of `=`.
    const setext = /^[^\n]+\r?\n=+[ \t]*(?:\r?\n|$)/u.exec(rest);
    if (setext) {
        return rest.slice(setext[0].length).replace(/^(?:[ \t]*\r?\n)+/u, '');
    }

    return src;
}

function isExternalHref(href: string | undefined): boolean {
    if (!href) return false;
    return /^https?:\/\//iu.test(href);
}

function MarkdownAnchor({
    href,
    children,
    ...rest
}: ComponentPropsWithoutRef<'a'>) {
    if (isExternalHref(href)) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                {children}
            </a>
        );
    }
    return (
        <a href={href} {...rest}>
            {children}
        </a>
    );
}

/**
 * Resolve a Markdown image `src` into a themed light/dark pair, or `null` when
 * it should render as a single image.
 *
 * Two themed sources are recognised:
 *  - An UPLOADED pair, flagged by a trailing `#themed` URL fragment. The editor
 *    inserts `![alt](<lightUrl>#themed)` after uploading both variants; the
 *    dark sibling URL is derived by inserting `_dark` before the extension.
 *  - A COMMITTED diagram under `/articles/…*.svg` (the existing convention,
 *    requiring no authoring marker), excluding sources that are already the
 *    `…_dark.svg` variant.
 *
 * In both cases the dark URL is derived by inserting `_dark` immediately before
 * the final extension (`…/uuid.svg` → `…/uuid_dark.svg`). We pair + CSS-swap by
 * theme so an `<img>` — which can't inherit `currentColor` — still tracks the
 * site's manual light/dark toggle. The `#themed` marker is stripped here and is
 * NEVER present in a rendered `src`.
 */
export function resolveThemedImage(
    src: string,
): { light: string; dark: string } | null {
    const marked = /#themed$/iu.test(src);
    const clean = src.replace(/#themed$/iu, '');

    const isCommittedArticleSvg =
        /^\/articles\/.+\.svg$/iu.test(clean) && !/_dark\.svg$/iu.test(clean);

    if (!marked && !isCommittedArticleSvg) return null;

    // Insert `_dark` before the final extension (generic over any `.ext`).
    const dark = clean.replace(/(\.[a-z0-9]+)$/iu, '_dark$1');
    return { light: clean, dark };
}

function MarkdownImage({
    src,
    alt,
    title,
    ...rest
}: ComponentPropsWithoutRef<'img'>) {
    const themed = typeof src === 'string' ? resolveThemedImage(src) : null;
    if (themed) {
        // Both variants carry the SAME alt; `display:none` removes the hidden
        // one from the a11y tree, so exactly one alt is announced per theme.
        return (
            <>
                {/* eslint-disable-next-line @next/next/no-img-element -- DB-authored content path; next/image needs known dimensions/loader we don't have here */}
                <img
                    src={themed.light}
                    alt={alt ?? ''}
                    title={title}
                    className="themed-img-light mx-auto h-auto max-w-full"
                    {...rest}
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
                <img
                    src={themed.dark}
                    alt={alt ?? ''}
                    title={title}
                    className="themed-img-dark mx-auto h-auto max-w-full"
                    {...rest}
                />
            </>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element -- see above
        <img
            src={src}
            alt={alt ?? ''}
            title={title}
            className="mx-auto h-auto max-w-full"
            {...rest}
        />
    );
}

/**
 * Wrap GFM tables in a horizontally scrollable container so a wide table never
 * overflows the page on small screens. The table itself is styled in
 * `globals.css` (`.prose table`).
 */
function MarkdownTable({
    node: _node,
    ...props
}: ComponentPropsWithoutRef<'table'> & { node?: unknown }) {
    return (
        <div className="overflow-x-auto">
            <table {...props} />
        </div>
    );
}

/**
 * Render a DB-sourced Markdown article body as React.
 *
 * Security: bodies come from the database, so we render via `react-markdown`
 * with `rehype-sanitize` (no `dangerouslySetInnerHTML`, no `new Function`).
 * GitHub-flavored Markdown is enabled via `remark-gfm`. External links open in
 * a new tab with `rel="noopener noreferrer"`.
 */
export default function ArticleBody({ body }: { body: string }) {
    const content = stripLeadingH1(body ?? '');
    return (
        <div className="prose prose-norwegian dark:prose-invert max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                    a: MarkdownAnchor,
                    img: MarkdownImage,
                    table: MarkdownTable,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
