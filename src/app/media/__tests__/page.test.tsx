import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Media page static checks', () => {
    it('fetches from the MCP books API and renders Tabs', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'media',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain("import('@/lib/services/books')");
        expect(src).toContain('Tabs');
        expect(src).toContain('BooksTable');
    });
});
