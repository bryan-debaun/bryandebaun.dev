import { describe, it, expect } from 'vitest';
import * as route from '../route';

describe('GET /api/mcp/ratings (deprecated)', () => {
    it('returns empty ratings array', async () => {
        const res = (await route.GET(new Request('http://localhost/api/mcp/ratings'))) as Response;
        const json = await res.json();
        expect(json.ratings).toEqual([]);
        expect(json.total).toBe(0);
    });

    it('returns empty regardless of query params', async () => {
        const res = await route.GET(new Request('http://localhost/api/mcp/ratings?bookId=2'));
        const json = await res.json();
        expect(json.ratings).toEqual([]);
        expect(json.total).toBe(0);
    });
});
