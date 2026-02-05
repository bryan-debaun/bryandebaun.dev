import { readFileSync } from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
// Simple static checks for presence/absence of classes related to overflow handling
describe('Projects page static checks', () => {
    it('uses min-w-0 and truncate instead of whitespace-nowrap', () => {
        const filePath = path.resolve(process.cwd(), 'src', 'app', 'projects', 'page.tsx');
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain('min-w-0');
        expect(src).toContain('truncate');
        // ensure no problematic whitespace-nowrap remains on the project card
        expect(src).not.toContain('whitespace-nowrap');
    });
});
