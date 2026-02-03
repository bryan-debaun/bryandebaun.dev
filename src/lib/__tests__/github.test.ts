import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getUserRepos, getShowcaseRepos } from '../github'

const sampleRepos = [
    { name: 'one', description: 'First', html_url: 'https://github.com/x/one', homepage: null, archived: false, fork: false, topics: [] },
    { name: 'two', description: 'Second', html_url: 'https://github.com/x/two', homepage: null, archived: false, fork: true, topics: [] },
    { name: 'three', description: 'Archived', html_url: 'https://github.com/x/three', homepage: null, archived: true, fork: false, topics: ['showcase'] },
]

describe('github lib', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock as any)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('getUserRepos fetches pages until empty', async () => {
        // Page 1 returns two items, page 2 returns one item, page 3 returns empty
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [sampleRepos[0], sampleRepos[1]] })
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [sampleRepos[2]] })
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] })

        const res = await getUserRepos('me', { perPage: 2 })
        expect(res.length).toBe(3)
        expect(fetchMock.mock.calls.length).toBe(2)
    })

    it('getShowcaseRepos filters forks and archived by default', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => sampleRepos })

        const res = await getShowcaseRepos('me')
        expect(res.find((r) => r.name === 'one')).toBeTruthy()
        expect(res.find((r) => r.name === 'two')).toBeFalsy()
        expect(res.find((r) => r.name === 'three')).toBeFalsy()
    })

    it('getShowcaseRepos can include forks and archived when requested', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => sampleRepos })

        const res = await getShowcaseRepos('me', { includeForks: true, includeArchived: true })
        expect(res.find((r) => r.name === 'one')).toBeTruthy()
        expect(res.find((r) => r.name === 'two')).toBeTruthy()
        expect(res.find((r) => r.name === 'three')).toBeTruthy()
    })

    it('uses GITHUB_TOKEN from env when present', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })

        process.env.GITHUB_TOKEN = 'env-token'
        await getUserRepos('me')
        const lastCallArgs = fetchMock.mock.calls[0]
        expect(lastCallArgs[1].headers.Authorization).toBe('token env-token')
        delete process.env.GITHUB_TOKEN
    })

    it('opts.token overrides env var', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })

        process.env.GITHUB_TOKEN = 'env-token'
        await getUserRepos('me', { token: 'opt-token' })
        const lastCallArgs = fetchMock.mock.calls[0]
        expect(lastCallArgs[1].headers.Authorization).toBe('token opt-token')
        delete process.env.GITHUB_TOKEN
    })
})