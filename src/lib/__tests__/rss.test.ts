import { describe, it, expect } from 'vitest';
import { generateRSS } from '../rss';

describe('rss generation', () => {
    it('renders an item per entry with a title and link', () => {
        const xml = generateRSS('https://example.com', [
            { slug: 'writing/hello', title: 'Hello' },
            { slug: 'writing/world', title: 'World' },
        ]);
        expect(xml).toContain('<title>Hello</title>');
        expect(xml).toContain(
            '<link>https://example.com/writing/hello</link>',
        );
        expect(xml).toContain('<title>World</title>');
    });

    it('produces a valid empty feed with no items', () => {
        const xml = generateRSS('https://example.com', []);
        expect(xml).toContain('<rss version="2.0">');
        expect(xml).not.toContain('<item>');
    });
});
