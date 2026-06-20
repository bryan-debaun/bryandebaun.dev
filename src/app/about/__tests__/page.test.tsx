import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

describe('About page static checks', () => {
    it('includes a Why BAD section', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'about',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain('Why BAD');
    });

    it('imports and uses WorkPassions component', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'about',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain(
            "import WorkPassions from '@/components/WorkPassions'",
        );
        expect(src).toContain('<WorkPassions');
    });

    it('still renders NowReading and PhilosophyList', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'about',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain(
            "import NowReading from '@/components/NowReading'",
        );
        expect(src).toContain(
            "import PhilosophyList from '@/components/PhilosophyList'",
        );
    });
});
