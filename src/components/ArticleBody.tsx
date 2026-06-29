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
                components={{ a: MarkdownAnchor }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
