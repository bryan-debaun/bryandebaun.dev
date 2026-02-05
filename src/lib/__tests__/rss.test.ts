import { describe, it, expect } from 'vitest';
import { generateRSS } from '../rss';

describe('rss generation', () => {
    it('does not include private items', () => {
        const items = [
            { slug: 'blog/h', title: 'Hello', private: false },
            { slug: 'blog/x', title: 'Secret', private: true },
        ];
        const xml = generateRSS('https://example.com', items);
        expect(xml).toContain('<title>Hello</title>');
        expect(xml).not.toContain('Secret');
    });
});