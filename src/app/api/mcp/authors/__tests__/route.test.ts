import { describe, it, expect, vi } from 'vitest'
import * as route from '../route'
import type { Api } from '@bryandebaun/mcp-client'

describe('GET /api/mcp/authors', () => {
    it('returns authors from the generated Api client', async () => {
        // Stub the createApi factory to return a fake Api instance
        const fakeApi = { api: { listAuthors: vi.fn().mockResolvedValue({ data: { authors: [{ id: 1, name: 'Test Author' }], total: 1 } }) } } as unknown as Api<unknown>

        const spy = vi.spyOn(route as unknown as { createApi: () => Api<unknown> }, 'createApi').mockImplementation(() => fakeApi)

        const res = await route.GET() as unknown as Response
        const json = await res.json()
        expect(json.total).toBe(1)
        expect(json.authors[0].name).toBe('Test Author')

        spy.mockRestore()
    })
})
