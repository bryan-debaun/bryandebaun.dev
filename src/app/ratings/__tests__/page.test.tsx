import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Ratings page static checks', () => {
    it('fetches from the MCP books API for embedded ratings', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'ratings',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        // Ratings page now fetches books and filters by rating field
        expect(src).toContain('/api/mcp/books');
    });
});
