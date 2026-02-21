import { describe, it, expect, vi, afterEach } from 'vitest';

// Keep mocks local to these tests
afterEach(() => {
    vi.restoreAllMocks();
});

describe('Books page — render with embedded ratings', () => {
    it('renders books with embedded rating field', async () => {
        const fakeBooks = [{ id: 1, title: 'A', rating: 4.4, createdAt: '', updatedAt: '', authors: [] }];

        await vi.doMock('@/lib/services/books', () => ({ listBooks: async () => fakeBooks }));

        // Import the page module and execute the server component function
        const page = (await import('@/app/books/page')).default as () => Promise<unknown>;
        const result = await page();

        expect(result).toBeDefined();
    });

    it('renders books without rating', async () => {
        const fakeBooks = [{ id: 1, title: 'A', createdAt: '', updatedAt: '', authors: [] }];

        await vi.doMock('@/lib/services/books', () => ({ listBooks: async () => fakeBooks }));

        const page = (await import('@/app/books/page')).default as () => Promise<unknown>;
        const result = await page();

        expect(result).toBeDefined();
    });
});