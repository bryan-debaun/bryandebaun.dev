import { readFileSync } from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Books page static checks', () => {
    it('fetches from the MCP books API', () => {
        const filePath = path.resolve(process.cwd(), 'src', 'app', 'books', 'page.tsx');
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain('/api/mcp/books');
        // We now use a client-side `BooksTableClient` component — ensure it's imported
        expect(src).toContain('BooksTableClient');

        // Verify the client component contains the semantic table markup and theme classes
        const dataTableFile = path.resolve(process.cwd(), 'src', 'components', 'DataTable.tsx');
        const dataTableSrc = readFileSync(dataTableFile, 'utf8');
        expect(dataTableSrc).toContain('<table');
        expect(dataTableSrc).toContain('min-w-full');
    });
});
