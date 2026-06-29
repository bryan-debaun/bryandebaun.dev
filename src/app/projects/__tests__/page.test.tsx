import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
// Simple static checks for presence/absence of classes related to overflow handling.
// The Projects page now renders a responsive card grid; the per-card overflow
// handling lives in the RepoCard component, so we assert against both files.
describe('Projects page static checks', () => {
    it('uses a responsive grid and min-w-0 on the page', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'projects',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain('min-w-0');
        // responsive card grid columns
        expect(src).toContain('grid-cols-1');
        expect(src).toContain('md:grid-cols-2');
        expect(src).toContain('lg:grid-cols-3');
        // ensure no problematic whitespace-nowrap remains on the project page
        expect(src).not.toContain('whitespace-nowrap');
    });

    it('Card handles overflow with min-w-0/truncate and clamps the description', () => {
        // RepoCard now delegates its presentation to the generic Card
        // component, so the overflow-handling classes live there.
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'components',
            'Card.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain('min-w-0');
        expect(src).toContain('truncate');
        expect(src).toContain('line-clamp-3');
        // names must wrap/break, never clip with whitespace-nowrap
        expect(src).not.toContain('whitespace-nowrap');
    });
});
