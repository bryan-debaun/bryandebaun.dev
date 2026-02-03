import { describe, it, expect, vi } from 'vitest';
import { Api, ListBooksResponse } from '../api-client';

describe('MCP client generator', () => {
    it('instantiates Api and calls request for listBooks', async () => {
        const api = new Api();

        // stub the request method to avoid network calls
        const mockRequest = vi.fn().mockResolvedValue({ data: { books: [], total: 0 } });
        // Assign with the same function type as `api.request` to avoid using `any` in tests
        type RequestType = typeof api.request
            ; (api as { request: RequestType }).request = mockRequest as RequestType;

        const res = await api.api.listBooks();

        expect(mockRequest).toHaveBeenCalled();
        const calledArgs = mockRequest.mock.calls[0][0];
        expect(calledArgs.path).toBe('/api/books');
        // ensure response has expected shape
        expect((res as { data: ListBooksResponse }).data.total).toBe(0);
    });
});
