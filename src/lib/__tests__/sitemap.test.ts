import { describe, it, expect } from 'vitest'
import { generateSitemap } from '../sitemap'

describe('sitemap generation', () => {
    it('does not include private items', () => {
        const items = [
            { slug: 'philosophy/hello', private: false },
            { slug: 'philosophy/secret', private: true },
        ]
        const xml = generateSitemap('https://example.com', items)
        expect(xml).toContain('<loc>https://example.com/philosophy/hello</loc>')
        expect(xml).not.toContain('secret')
    })
})
