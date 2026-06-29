import { describe, it, expect } from 'vitest';
import nextConfig from '../../../next.config';

/**
 * The articles section was renamed from /philosophy to /writing. Old URLs are
 * indexed and have published articles, so the Next config must permanently
 * (308) redirect both the index and any slug path to the /writing equivalent.
 */
describe('next.config redirects', () => {
    it('permanently redirects the old philosophy URLs to writing', async () => {
        expect(typeof nextConfig.redirects).toBe('function');
        const rules = await nextConfig.redirects?.();
        expect(rules).toEqual(
            expect.arrayContaining([
                {
                    source: '/philosophy',
                    destination: '/writing',
                    permanent: true,
                },
                {
                    source: '/philosophy/:slug*',
                    destination: '/writing/:slug*',
                    permanent: true,
                },
            ]),
        );
    });
});
