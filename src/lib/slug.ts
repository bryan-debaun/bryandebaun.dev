/**
 * Convert arbitrary text into a URL-safe slug: lowercase, ASCII-folded,
 * non-alphanumerics collapsed to single hyphens, no leading/trailing hyphens.
 * Used to auto-suggest an article slug from its title.
 */
export function slugify(input: string): string {
    return input
        .normalize('NFKD')
        .replace(/[̀-ͯ]/gu, '') // strip diacritics
        .toLowerCase()
        .replace(/[^a-z0-9]+/gu, '-')
        .replace(/^-+|-+$/gu, '');
}
