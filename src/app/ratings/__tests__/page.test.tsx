import { readFileSync } from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Ratings page static checks', () => {
    it('fetches from the MCP ratings API', () => {
        const filePath = path.resolve(process.cwd(), 'src', 'app', 'ratings', 'page.tsx');
        const src = readFileSync(filePath, 'utf8');
        expect(src).toContain('/api/mcp/ratings');
    });
});
