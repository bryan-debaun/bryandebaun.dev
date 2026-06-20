import { readFileSync } from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Admin page', () => {
    it('is a server component with server-side auth via Supabase (no "use client")', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'admin',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).not.toContain("'use client'");
        expect(src).toContain('@/lib/supabase/server');
        expect(src).toContain('redirect');
    });

    it('renders BooksTable with isAdmin prop and server-fetched books', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'admin',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain('BooksTable');
        expect(src).toContain('isAdmin');
        expect(src).toContain('listBooks');
    });

    it('redirects to /login when no user and to / when user is not admin', () => {
        const filePath = path.resolve(
            process.cwd(),
            'src',
            'app',
            'admin',
            'page.tsx',
        );
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain("redirect('/login')");
        expect(src).toContain("redirect('/')");
    });
});
