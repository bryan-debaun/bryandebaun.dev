import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

function readAdminPage(): string {
    const filePath = path.resolve(
        process.cwd(),
        'src',
        'app',
        'admin',
        'page.tsx',
    );
    return readFileSync(filePath, 'utf8');
}

describe('Admin page', () => {
    it('is a server component (no "use client")', () => {
        expect(readAdminPage()).not.toContain("'use client'");
    });

    it('renders BooksTable with isAdmin prop and server-fetched books', () => {
        const src = readAdminPage();
        expect(src).toContain('BooksTable');
        expect(src).toContain('isAdmin');
        expect(src).toContain('listBooks');
    });

    it('guards access via the secure app_metadata page guard', () => {
        const src = readAdminPage();
        // The page delegates auth to requireAdminPage(), which reads the SECURE
        // app_metadata.role and redirects (/login when unauthenticated, / when
        // non-admin). See src/lib/__tests__/auth-guard.test.ts for the behavior.
        expect(src).toContain('requireAdminPage');
    });

    it('does NOT use the insecure user-editable user_metadata for authorization', () => {
        // Reading the role from user_metadata is a privilege-escalation bug:
        // user_metadata is user-editable. Authorization must use app_metadata
        // (enforced inside requireAdminPage), never user_metadata here.
        expect(readAdminPage()).not.toContain('user_metadata');
    });
});
