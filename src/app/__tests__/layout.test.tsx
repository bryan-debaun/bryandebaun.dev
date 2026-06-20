import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Layout static checks', () => {
    it('footer has responsive alignment and grouped logo text', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'layout.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain('justify-center md:justify-start');
        expect(src).toContain('whitespace-nowrap');
    });
});
