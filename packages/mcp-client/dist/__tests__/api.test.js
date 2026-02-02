import { describe, it, expect, vi } from 'vitest';
import { Api } from '../api-client';
describe('MCP client generator', () => {
    it('instantiates Api and calls request for listBooks', async () => {
        const api = new Api();
        // stub the request method to avoid network calls
        const mockRequest = vi.fn().mockResolvedValue({ data: { books: [], total: 0 } });
        api.request = mockRequest;
        const res = await api.api.listBooks();
        expect(mockRequest).toHaveBeenCalled();
        const calledArgs = mockRequest.mock.calls[0][0];
        expect(calledArgs.path).toBe('/api/books');
        // ensure response has expected shape
        expect(res.data.total).toBe(0);
    });
});
