import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArticleBody, {
    resolveThemedImage,
    stripLeadingH1,
} from '../ArticleBody';

describe('stripLeadingH1', () => {
    it('removes a leading ATX H1 that duplicates the title', () => {
        const out = stripLeadingH1('# CPTSD\n\nFirst paragraph.');
        expect(out).not.toMatch(/^#\s/);
        expect(out.startsWith('First paragraph.')).toBe(true);
    });

    it('removes a leading H1 even after blank lines', () => {
        const out = stripLeadingH1('\n\n# Title\n\nBody.');
        expect(out.startsWith('Body.')).toBe(true);
    });

    it('removes a leading setext H1 (underlined with =)', () => {
        const out = stripLeadingH1('Title\n=====\n\nBody.');
        expect(out.startsWith('Body.')).toBe(true);
    });

    it('does not strip a leading H2', () => {
        const out = stripLeadingH1('## TL;DR\n\nBody.');
        expect(out.startsWith('## TL;DR')).toBe(true);
    });

    it('only strips the first H1, preserving later headings', () => {
        const out = stripLeadingH1('# One\n\nText\n\n# Two');
        expect(out).toContain('# Two');
        expect(out).not.toContain('# One');
    });

    it('leaves a body with no leading H1 unchanged', () => {
        const md = 'Just a paragraph with no heading.';
        expect(stripLeadingH1(md)).toBe(md);
    });
});

describe('ArticleBody rendering', () => {
    it('renders Markdown body without the duplicate leading H1', () => {
        render(<ArticleBody body={'# Duplicate Title\n\nHello **world**.'} />);
        // The leading H1 is stripped, so no heading element should render.
        expect(screen.queryByRole('heading')).toBeNull();
        expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('opens external links in a new tab with safe rel', () => {
        render(<ArticleBody body={'See [example](https://example.com).'} />);
        const link = screen.getByRole('link', { name: 'example' });
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('keeps internal links in the same tab', () => {
        render(<ArticleBody body={'A [note](/philosophy/other).'} />);
        const link = screen.getByRole('link', { name: 'note' });
        expect(link).toHaveAttribute('href', '/philosophy/other');
        expect(link).not.toHaveAttribute('target');
    });

    it('sanitizes raw HTML in the body (no script execution surface)', () => {
        const { container } = render(
            <ArticleBody
                body={'Hi<script>window.__pwned = true</script> there'}
            />,
        );
        // rehype-sanitize strips <script>; it must never reach the DOM.
        expect(container.querySelector('script')).toBeNull();
    });

    it('renders GFM tables via remark-gfm', () => {
        render(<ArticleBody body={'| a | b |\n| - | - |\n| 1 | 2 |'} />);
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('pairs a themed /articles SVG with its _dark sibling and CSS-swaps', () => {
        const { container } = render(
            <ArticleBody body={'![All committed](/articles/xe_all_committed.svg)'} />,
        );
        const imgs = Array.from(container.querySelectorAll('img'));
        expect(imgs).toHaveLength(2);

        const light = imgs[0];
        const dark = imgs[1];
        // Light variant: real alt, shown in light mode / hidden in dark.
        expect(light).toHaveAttribute('src', '/articles/xe_all_committed.svg');
        expect(light).toHaveAttribute('alt', 'All committed');
        expect(light.className).toContain('themed-img-light');
        // Dark variant: derived _dark src, same alt (display:none de-dupes the
        // a11y tree, so the alt is announced in dark mode too).
        expect(dark).toHaveAttribute(
            'src',
            '/articles/xe_all_committed_dark.svg',
        );
        expect(dark).toHaveAttribute('alt', 'All committed');
        expect(dark.className).toContain('themed-img-dark');
    });

    it('does not pair non-/articles images (single img, no _dark swap)', () => {
        const { container } = render(
            <ArticleBody body={'![logo](/images/logo.svg)'} />,
        );
        const imgs = Array.from(container.querySelectorAll('img'));
        expect(imgs).toHaveLength(1);
        expect(imgs[0]).toHaveAttribute('src', '/images/logo.svg');
    });

    it('does not double-pair an already-_dark src', () => {
        const { container } = render(
            <ArticleBody body={'![x](/articles/xe_all_committed_dark.svg)'} />,
        );
        // Already the dark file → treat as a plain single image.
        expect(container.querySelectorAll('img')).toHaveLength(1);
    });

    it('pairs an uploaded #themed image, deriving the dark sibling URL', () => {
        const { container } = render(
            <ArticleBody
                body={
                    '![diagram](https://storage.example.com/article-assets/2026/abc-123.svg#themed)'
                }
            />,
        );
        const imgs = Array.from(container.querySelectorAll('img'));
        expect(imgs).toHaveLength(2);

        const [light, dark] = imgs;
        // The #themed marker is stripped — it never reaches a rendered src.
        expect(light).toHaveAttribute(
            'src',
            'https://storage.example.com/article-assets/2026/abc-123.svg',
        );
        expect(dark).toHaveAttribute(
            'src',
            'https://storage.example.com/article-assets/2026/abc-123_dark.svg',
        );
        expect(light).toHaveAttribute('alt', 'diagram');
        expect(dark).toHaveAttribute('alt', 'diagram');
        expect(light.className).toContain('themed-img-light');
        expect(dark.className).toContain('themed-img-dark');
        for (const img of imgs) {
            expect(img.getAttribute('src')).not.toContain('#themed');
        }
    });

    it('keeps a non-themed external image as a single img', () => {
        const { container } = render(
            <ArticleBody
                body={'![logo](https://cdn.example.com/logo.svg)'}
            />,
        );
        const imgs = Array.from(container.querySelectorAll('img'));
        expect(imgs).toHaveLength(1);
        expect(imgs[0]).toHaveAttribute(
            'src',
            'https://cdn.example.com/logo.svg',
        );
    });
});

describe('resolveThemedImage', () => {
    it('returns a derived pair for an uploaded #themed url', () => {
        expect(
            resolveThemedImage('https://x/2026/abc.svg#themed'),
        ).toEqual({
            light: 'https://x/2026/abc.svg',
            dark: 'https://x/2026/abc_dark.svg',
        });
    });

    it('derives _dark before the extension for any ext', () => {
        expect(resolveThemedImage('https://x/2026/abc.png#themed')).toEqual({
            light: 'https://x/2026/abc.png',
            dark: 'https://x/2026/abc_dark.png',
        });
    });

    it('pairs a committed /articles svg without a marker', () => {
        expect(resolveThemedImage('/articles/diagram.svg')).toEqual({
            light: '/articles/diagram.svg',
            dark: '/articles/diagram_dark.svg',
        });
    });

    it('returns null for a plain non-themed image', () => {
        expect(resolveThemedImage('/images/logo.svg')).toBeNull();
        expect(resolveThemedImage('https://cdn/x.png')).toBeNull();
    });

    it('returns null for an already-_dark committed svg', () => {
        expect(resolveThemedImage('/articles/diagram_dark.svg')).toBeNull();
    });
});
