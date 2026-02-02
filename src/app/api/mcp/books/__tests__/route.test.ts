import { describe, it, expect, vi } from 'vitest'
import * as route from '../route'
import type { Api } from '@bryandebaun/mcp-client'

describe('GET /api/mcp/books', () => {
    it('returns books from the generated Api client', async () => {
        // Stub the createApi factory to return a fake Api instance
        const fakeApi = { api: { listBooks: vi.fn().mockResolvedValue({ data: { books: [{ id: 1, title: 'Test Book' }], total: 1 } }) } } as unknown as Api

        const spy = vi.spyOn(route as unknown as { createApi: () => Api }, 'createApi').mockImplementation(() => fakeApi)

        const res = await route.GET() as unknown as Response
        const json = await res.json()
        expect(json.total).toBe(1)
        expect(json.books[0].title).toBe('Test Book')

        spy.mockRestore()
    })
})
