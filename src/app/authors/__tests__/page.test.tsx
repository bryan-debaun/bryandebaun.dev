import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Authors page static checks', () => {
    it('fetches from the MCP authors API', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'authors',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain("import('@/lib/services/authors')");
    });
});
